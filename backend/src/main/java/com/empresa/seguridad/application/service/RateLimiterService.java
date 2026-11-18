package com.empresa.seguridad.application.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class RateLimiterService {

    @Value("${application.security.rate-limit.max-attempts-per-minute:10}")
    private int maxAttemptsPerMinute;

    private static class RequestBucket {
        final AtomicInteger count = new AtomicInteger(0);
        volatile long windowStartEpochSecond;

        RequestBucket(long windowStartEpochSecond) {
            this.windowStartEpochSecond = windowStartEpochSecond;
        }
    }

    private final Map<String, RequestBucket> bucketCache = new ConcurrentHashMap<>();

    public boolean isAllowed(String key) {
        long currentEpochMinute = Instant.now().getEpochSecond() / 60;
        
        RequestBucket bucket = bucketCache.compute(key, (k, existing) -> {
            if (existing == null || existing.windowStartEpochSecond != currentEpochMinute) {
                RequestBucket newBucket = new RequestBucket(currentEpochMinute);
                newBucket.count.set(1);
                return newBucket;
            } else {
                existing.count.incrementAndGet();
                return existing;
            }
        });

        // Limpiar periódicamente si el caché crece
        if (bucketCache.size() > 5000) {
            bucketCache.entrySet().removeIf(e -> e.getValue().windowStartEpochSecond < currentEpochMinute);
        }

        return bucket.count.get() <= maxAttemptsPerMinute;
    }
}
