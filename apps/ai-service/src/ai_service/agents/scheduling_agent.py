from datetime import datetime, timedelta, timezone
from typing import List, Optional
from ai_service.agents.base import BaseAgent
from ai_service.models.schemas import (
    AvailabilitySlotInput,
    RecommendedSlot,
    SchedulingRecommendation,
    SchedulingRequest
)
from ai_service.prompts.templates import (
    SCHEDULING_REASONING_SYSTEM_PROMPT,
    SCHEDULING_REASONING_USER_PROMPT
)

class InterviewSchedulingAgent:
    """
    Agent 6: Analyzes candidate and interviewer availability slots, solves constraint overlaps,
    detects scheduling conflicts, and recommends optimized interview time slots.
    """

    def __init__(self):
        self.name = "InterviewSchedulingAgent"

    async def execute(
        self,
        request: SchedulingRequest
    ) -> SchedulingRecommendation:
        return self.schedule(
            candidate_id=request.candidate_id,
            interviewer_id=request.interviewer_id,
            candidate_slots=request.candidate_slots,
            interviewer_slots=request.interviewer_slots,
            duration_minutes=request.duration_minutes,
            target_timezone=request.timezone
        )

    def schedule(
        self,
        candidate_id: str,
        interviewer_id: str,
        candidate_slots: List[AvailabilitySlotInput],
        interviewer_slots: List[AvailabilitySlotInput],
        duration_minutes: int = 45,
        target_timezone: str = "UTC"
    ) -> SchedulingRecommendation:
        """
        Deterministic constraint satisfaction algorithm finding mutual availability windows.
        """
        recommended_slots: List[RecommendedSlot] = []
        conflicts: List[str] = []
        slot_duration = timedelta(minutes=duration_minutes)

        if not candidate_slots:
            conflicts.append("No availability slots provided by Candidate.")
        if not interviewer_slots:
            conflicts.append("No availability slots provided by Interviewer.")

        if candidate_slots and interviewer_slots:
            for c_slot in candidate_slots:
                c_start = c_slot.start_time
                c_end = c_slot.end_time

                for i_slot in interviewer_slots:
                    i_start = i_slot.start_time
                    i_end = i_slot.end_time

                    # Calculate mutual overlap interval
                    overlap_start = max(c_start, i_start)
                    overlap_end = min(c_end, i_end)

                    if overlap_end - overlap_start >= slot_duration:
                        # Generate candidate slot(s) within the overlap
                        curr_start = overlap_start
                        while curr_start + slot_duration <= overlap_end and len(recommended_slots) < 5:
                            curr_end = curr_start + slot_duration
                            
                            # Score higher if scheduled during standard working hours (09:00 - 17:00)
                            hour = curr_start.hour
                            score = 1.0 if 9 <= hour <= 16 else 0.8

                            recommended_slots.append(
                                RecommendedSlot(
                                    start_time=curr_start,
                                    end_time=curr_end,
                                    interviewer_id=interviewer_id,
                                    candidate_id=candidate_id,
                                    conflict_detected=False,
                                    score=score
                                )
                            )
                            # Advance by 30-minute increments for multiple options
                            curr_start += timedelta(minutes=30)

        # Generate reasoning summary
        if recommended_slots:
            recommended_slots.sort(key=lambda s: (-s.score, s.start_time))
            first_slot = recommended_slots[0]
            reasoning = (
                f"Identified {len(recommended_slots)} mutual interview window(s). "
                f"Top recommendation is {first_slot.start_time.strftime('%Y-%m-%d from %H:%M')} to {first_slot.end_time.strftime('%H:%M')} "
                f"({target_timezone}) with optimal working-hour score."
            )
        else:
            if not conflicts:
                conflicts.append("No overlapping availability slots found between candidate and interviewer.")
            reasoning = (
                "Unable to find overlapping windows matching the required duration. "
                "Recommend requesting alternative availability slots or assigning an alternate interviewer."
            )

        return SchedulingRecommendation(
            recommended_slots=recommended_slots,
            conflicts=conflicts,
            reasoning=reasoning
        )
