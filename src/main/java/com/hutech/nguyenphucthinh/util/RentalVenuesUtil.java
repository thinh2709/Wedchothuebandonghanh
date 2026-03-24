package com.hutech.nguyenphucthinh.util;

import java.util.Arrays;
import java.util.List;

public final class RentalVenuesUtil {

    private RentalVenuesUtil() {
    }

    public static List<String> parse(String raw) {
        if (raw == null || raw.isBlank()) {
            return List.of();
        }
        return Arrays.stream(raw.split("\\R"))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }
}
