package com.hutech.nguyenphucthinh.util;

import java.util.Map;

public final class RequestBodyParseUtil {

    private RequestBodyParseUtil() {
    }

    public static Double readDouble(Map<String, ?> map, String key) {
        if (map == null) {
            return null;
        }
        Object v = map.get(key);
        if (v == null) {
            return null;
        }
        if (v instanceof Number n) {
            return n.doubleValue();
        }
        if (v instanceof String s && !s.isBlank()) {
            try {
                return Double.parseDouble(s.trim());
            } catch (NumberFormatException e) {
                return null;
            }
        }
        return null;
    }

    public static String readString(Map<String, ?> map, String key, String defaultValue) {
        if (map == null) {
            return defaultValue == null ? "" : defaultValue;
        }
        Object v = map.get(key);
        if (v == null) {
            return defaultValue == null ? "" : defaultValue;
        }
        return String.valueOf(v);
    }
}
