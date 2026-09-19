import asyncio
from typing import Callable, Any, TypeVar, Coroutine
from ai_service.core.logging import logger

T = TypeVar("T")


async def execute_with_retry_and_timeout(
    func: Callable[[], Coroutine[Any, Any, T]],
    step_name: str,
    workflow_id: str,
    max_retries: int = 3,
    timeout_seconds: float = 30.0,
    initial_delay: float = 0.5,
    backoff_factor: float = 1.5,
    on_retry: Callable[[int, Exception], Coroutine[Any, Any, None]] = None,
) -> T:
    """
    Executes an async task with per-attempt timeout enforcement, retry limits, and exponential backoff.
    """
    last_exception = None
    delay = initial_delay

    for attempt in range(1, max_retries + 1):
        try:
            logger.info(
                f"[{workflow_id}] Executing step '{step_name}' (Attempt {attempt}/{max_retries}, Timeout: {timeout_seconds}s)..."
            )

            # Enforce strict step timeout
            result = await asyncio.wait_for(func(), timeout=timeout_seconds)
            return result

        except asyncio.TimeoutError as te:
            last_exception = TimeoutError(
                f"Step '{step_name}' timed out after {timeout_seconds} seconds on attempt {attempt}"
            )
            logger.warning(f"[{workflow_id}] {last_exception}")
        except Exception as ex:
            last_exception = ex
            logger.warning(
                f"[{workflow_id}] Step '{step_name}' attempt {attempt} failed with error: {ex}"
            )

        if attempt < max_retries:
            if on_retry:
                try:
                    await on_retry(attempt, last_exception)
                except Exception as cb_ex:
                    logger.warning(f"[{workflow_id}] on_retry callback failed: {cb_ex}")

            logger.info(
                f"[{workflow_id}] Retrying step '{step_name}' in {delay:.2f}s..."
            )
            await asyncio.sleep(delay)
            delay *= backoff_factor

    # If all attempts exhausted, raise the last exception
    logger.error(
        f"[{workflow_id}] Step '{step_name}' exhausted all {max_retries} retry attempts."
    )
    raise last_exception
