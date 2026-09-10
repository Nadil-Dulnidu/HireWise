import re
from typing import Tuple, Optional, Set, Dict

# Prohibited prompt injection phrases and system usurpation patterns
PROMPT_INJECTION_PATTERNS = [
    r"(?i)\bignore\s+(?:all\s+)?(?:previous|prior|above)\s+instructions\b",
    r"(?i)\bdisregard\s+(?:all\s+)?(?:previous|prior|above)\s+(?:rules|instructions|prompts)\b",
    r"(?i)\bsystem\s+override\b",
    r"(?i)\byou\s+are\s+now\s+(?:in\s+)?(?:DAN|developer\s+mode|unrestricted|jailbreak)\b",
    r"(?i)\boutput\s+(?:your\s+)?(?:system\s+prompt|initial\s+instructions|hidden\s+rules)\b",
    r"(?i)\bdo\s+not\s+follow\s+any\s+safety\s+guidelines\b",
    r"(?i)<\s*/?\s*system\s*>",
    r"(?i)\[\s*system\s*\]",
    r"(?i)\bprint\s+all\s+environment\s+variables\b",
    r"(?i)\breveal\s+(?:the\s+)?api\s+key\b",
]

# Tool permissions allow-list mapped per agent name
AGENT_ALLOWED_TOOLS: Dict[str, Set[str]] = {
    "JobAnalysisAgent": {"text_extractor", "keyword_extractor"},
    "ResumeAnalysisAgent": {"pdf_parser", "docx_parser", "text_extractor"},
    "CandidateEvaluationAgent": {"scoring_calculator", "skills_matcher"},
    "ValidationAgent": {"schema_validator", "business_rule_checker"},
    "QuestionGeneratorAgent": {"question_template_library", "rubric_evaluator"},
    "SchedulingAgent": {
        "availability_matcher",
        "calendar_checker",
        "timezone_converter",
    },
}


def detect_prompt_injection(text: Optional[str]) -> Tuple[bool, Optional[str]]:
    """
    Scans input text against known prompt injection heuristics and adversarial payloads.
    Returns (is_injection_detected, reason).
    """
    if not text:
        return False, None

    for pattern in PROMPT_INJECTION_PATTERNS:
        match = re.search(pattern, text)
        if match:
            return True, f"Suspicious prompt pattern detected: '{match.group(0)}'"

    return False, None


def sanitize_text(text: Optional[str], max_length: int = 25000) -> str:
    """
    Sanitizes untrusted input text from external documents/resumes/job specs.
    Removes null bytes, normalizes whitespace, escapes control tags, and enforces safe length limits.
    """
    if not text:
        return ""

    # Strip null bytes and non-printable control characters (keep standard newlines and tabs)
    cleaned = re.sub(r"[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]", "", text)

    # Neutralize dangerous fake system delimiters
    cleaned = re.sub(r"(?i)<\s*system\s*>", "[sanitized-tag]", cleaned)
    cleaned = re.sub(r"(?i)<\s*/\s*system\s*>", "[/sanitized-tag]", cleaned)
    cleaned = re.sub(r"(?i)\[\s*system\s*\]", "[sanitized-system]", cleaned)

    # Truncate to maximum allowed safe character limit
    if len(cleaned) > max_length:
        cleaned = (
            cleaned[:max_length]
            + "\n[Content truncated for security and model token limits]"
        )

    return cleaned.strip()


def is_tool_allowed(agent_name: str, tool_name: str) -> bool:
    """
    Strict allow-list validation checking if an agent has explicit authorization to invoke a tool.
    """
    allowed_tools = AGENT_ALLOWED_TOOLS.get(agent_name, set())
    return tool_name in allowed_tools
