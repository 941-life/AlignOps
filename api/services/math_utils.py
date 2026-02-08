import math
from typing import List


def cosine_distance(a: List[float], b: List[float]) -> float:
    if len(a) != len(b):
        raise ValueError("Vectors must have the same dimension")

    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(y * y for y in b))
    if na == 0.0 or nb == 0.0:
        return 1.0

    similarity = dot / (na * nb)
    if not math.isfinite(similarity):
        return 1.0

    similarity = max(-1.0, min(1.0, similarity))
    return 1.0 - similarity
