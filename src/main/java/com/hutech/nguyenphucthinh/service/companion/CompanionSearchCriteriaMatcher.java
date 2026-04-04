package com.hutech.nguyenphucthinh.service.companion;

import com.hutech.nguyenphucthinh.model.Companion;

import java.math.BigDecimal;

/**
 * Logic lọc tìm kiếm companion (mục 4.2 báo cáo — tương đương validateSearchFilter / điều kiện C1–C8).
 * Tách riêng để đo độ phủ JaCoCo đúng phạ vi phân tích, không gộp cả {@link CompanionService}.
 * <p>
 * Dùng gán {@code ok = false} từng bước thay vì {@code ok = ok && ...} để tránh nhánh {@code false && …}
 * không bao giờ gặp ở bộ lọc đầu (JaCoCo báo thiếu branch dù logic tương đương).
 */
public final class CompanionSearchCriteriaMatcher {

    private CompanionSearchCriteriaMatcher() {
    }

    public static boolean matches(Companion c, String serviceType, String area, String gender,
                                  Boolean online, BigDecimal minPrice, BigDecimal maxPrice) {
        boolean ok = true;
        if (serviceType != null && !serviceType.isBlank()) {
            if (!serviceType.equalsIgnoreCase(c.getServiceType())) {
                ok = false;
            }
        }
        if (area != null && !area.isBlank()) {
            if (c.getArea() == null || !c.getArea().toLowerCase().contains(area.toLowerCase())) {
                ok = false;
            }
        }
        if (gender != null && !gender.isBlank()) {
            if (!gender.equalsIgnoreCase(c.getGender())) {
                ok = false;
            }
        }
        if (online != null) {
            if (!online.equals(c.getOnlineStatus())) {
                ok = false;
            }
        }
        BigDecimal cMin = c.getServicePriceMin();
        BigDecimal cMax = c.getServicePriceMax();
        if (cMin == null || cMax == null) {
            BigDecimal p = c.getPricePerHour() != null ? c.getPricePerHour() : BigDecimal.valueOf(200000);
            cMin = p;
            cMax = p;
        }
        if (minPrice != null && maxPrice != null) {
            if (cMax.compareTo(minPrice) < 0 || cMin.compareTo(maxPrice) > 0) {
                ok = false;
            }
        } else if (minPrice != null) {
            if (cMax.compareTo(minPrice) < 0) {
                ok = false;
            }
        } else if (maxPrice != null) {
            if (cMin.compareTo(maxPrice) > 0) {
                ok = false;
            }
        }
        return ok;
    }
}
