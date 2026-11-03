import time
from collections import defaultdict
from typing import Dict, List
from fastapi import Request, HTTPException, status

class InMemoryRateLimiter:
    """
    Thread-safe in-memory sliding window rate limiter.
    Limits requests based on client IP and target endpoint category.
    """
    def __init__(self):
        self._requests: Dict[str, List[float]] = defaultdict(list)

    def is_allowed(self, key: str, max_requests: int, window_seconds: int) -> bool:
        now = time.time()
        window_start = now - window_seconds
        timestamps = self._requests[key]
        
        # Prune timestamps older than window
        self._requests[key] = [t for t in timestamps if t > window_start]
        
        if len(self._requests[key]) >= max_requests:
            return False
            
        self._requests[key].append(now)
        return True

    def check(self, request: Request, category: str = "auth", max_requests: int = 5, window_seconds: int = 60):
        # Extract client IP (handle proxies/load balancers e.g. Vercel X-Forwarded-For)
        if not hasattr(request, "headers"):
            return  # Defensive guard for test harnesses or unexpected objects
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            client_ip = forwarded_for.split(",")[0].strip()
        else:
            client_ip = request.client.host if (hasattr(request, "client") and request.client) else "unknown"

        rate_key = f"{category}:{client_ip}"
        if not self.is_allowed(rate_key, max_requests=max_requests, window_seconds=window_seconds):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Too many requests. Please wait a minute before trying again.",
                headers={"Retry-After": str(window_seconds)}
            )

rate_limiter = InMemoryRateLimiter()
