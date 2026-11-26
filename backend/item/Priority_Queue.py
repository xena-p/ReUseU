import heapq
import itertools
from typing import Any


class EmptyPQError(Exception):
    def __str__(self) -> str:
        return 'Empty Priority Queue, you may NOT dequeue'


class PriorityQueue:
    """Max-priority queue backed by a binary heap: O(log n) enqueue and dequeue."""

    def __init__(self) -> None:
        self._heap: list[tuple[float, int, Any]] = []
        self._counter = itertools.count()  # tie-breaker

    def is_empty(self) -> bool:
        return not self._heap

    def enqueue(self, priority: float, item: Any) -> None:
        # heapq is a min-heap, so store -priority to pop the highest first
        heapq.heappush(self._heap, (-priority, next(self._counter), item))

    def dequeue(self) -> Any:
        if self.is_empty():
            raise EmptyPQError
        return heapq.heappop(self._heap)[2]

    def peek(self) -> Any:
        if self.is_empty():
            raise EmptyPQError
        return self._heap[0][2]