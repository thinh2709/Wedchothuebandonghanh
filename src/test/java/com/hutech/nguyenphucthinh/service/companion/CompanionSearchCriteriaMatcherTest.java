package com.hutech.nguyenphucthinh.service.companion;

import com.hutech.nguyenphucthinh.model.Companion;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Constructor;
import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * White-box: {@link CompanionSearchCriteriaMatcher} — mục 4.2 báo cáo.
 */
class CompanionSearchCriteriaMatcherTest {

    /** Gọi constructor private để JaCoCo phủ 100% instruction class (utility). */
    @Test
    void privateConstructorCoversUtilityClass() throws Exception {
        Constructor<CompanionSearchCriteriaMatcher> ctor = CompanionSearchCriteriaMatcher.class.getDeclaredConstructor();
        ctor.setAccessible(true);
        ctor.newInstance();
    }

    private Companion c;

    @BeforeEach
    void setUp() {
        c = new Companion();
        c.setServiceType("Du lịch");
        c.setArea("Hà Nội");
        c.setGender("Nam");
        c.setOnlineStatus(true);
        c.setPricePerHour(new BigDecimal("300000"));
    }

    @Test
    void allFiltersNull_passes() {
        assertTrue(CompanionSearchCriteriaMatcher.matches(c, null, null, null, null, null, null));
    }

    @Test
    void serviceTypeMismatch_fails() {
        assertFalse(CompanionSearchCriteriaMatcher.matches(c, "Ăn uống", null, null, null, null, null));
    }

    @Test
    void serviceTypeBlank_skippedSoStillPasses() {
        assertTrue(CompanionSearchCriteriaMatcher.matches(c, "   ", null, null, null, null, null));
    }

    @Test
    void areaFilterWhenCompanionAreaNull_fails() {
        c.setArea(null);
        assertFalse(CompanionSearchCriteriaMatcher.matches(c, null, "Hà", null, null, null, null));
    }

    @Test
    void areaFilterNoSubstringMatch_fails() {
        assertFalse(CompanionSearchCriteriaMatcher.matches(c, null, "Sài Gòn", null, null, null, null));
    }

    @Test
    void areaBlank_skipped() {
        assertTrue(CompanionSearchCriteriaMatcher.matches(c, null, "  ", null, null, null, null));
    }

    @Test
    void genderMismatch_fails() {
        assertFalse(CompanionSearchCriteriaMatcher.matches(c, null, null, "Nữ", null, null, null));
    }

    @Test
    void genderBlank_skipped() {
        assertTrue(CompanionSearchCriteriaMatcher.matches(c, null, null, "  ", null, null, null));
    }

    @Test
    void onlineMatchWhenFilterTrue_passes() {
        assertTrue(CompanionSearchCriteriaMatcher.matches(c, null, null, null, true, null, null));
    }

    @Test
    void areaSubstringMatch_passes() {
        assertTrue(CompanionSearchCriteriaMatcher.matches(c, null, "nội", null, null, null, null));
    }

    @Test
    void genderMatch_passes() {
        assertTrue(CompanionSearchCriteriaMatcher.matches(c, null, null, "nam", null, null, null));
    }

    @Test
    void onlineMismatch_fails() {
        assertFalse(CompanionSearchCriteriaMatcher.matches(c, null, null, null, false, null, null));
    }

    @Test
    void onlyMinPrice_companionMaxAboveMin_passes() {
        assertTrue(CompanionSearchCriteriaMatcher.matches(c, null, null, null, null, new BigDecimal("100000"), null));
    }

    @Test
    void onlyMinPrice_companionMaxBelowMin_fails() {
        c.setPricePerHour(new BigDecimal("50000"));
        assertFalse(CompanionSearchCriteriaMatcher.matches(c, null, null, null, null, new BigDecimal("100000"), null));
    }

    @Test
    void onlyMaxPrice_companionMinBelowMax_passes() {
        assertTrue(CompanionSearchCriteriaMatcher.matches(c, null, null, null, null, null, new BigDecimal("500000")));
    }

    @Test
    void onlyMaxPrice_failsWhenCompanionFloorAboveMax() {
        c.setServicePriceMin(null);
        c.setServicePriceMax(null);
        c.setPricePerHour(new BigDecimal("350000"));
        assertFalse(CompanionSearchCriteriaMatcher.matches(c, null, null, null, null, null, new BigDecimal("200000")));
    }

    @Test
    void servicePriceNullBoth_usesDefault200kForRange() {
        c.setServicePriceMin(null);
        c.setServicePriceMax(null);
        c.setPricePerHour(null);
        assertTrue(CompanionSearchCriteriaMatcher.matches(c, null, null, null, null, new BigDecimal("100000"), null));
        assertTrue(CompanionSearchCriteriaMatcher.matches(c, null, null, null, null, null, new BigDecimal("250000")));
    }

    @Test
    void minMaxRange_failsWhenCompanionMaxBelowMin() {
        c.setServicePriceMin(new BigDecimal("200000"));
        c.setServicePriceMax(new BigDecimal("250000"));
        assertFalse(CompanionSearchCriteriaMatcher.matches(c, null, null, null, null,
                new BigDecimal("300000"), new BigDecimal("500000")));
    }

    @Test
    void minMaxRange_failsWhenCompanionMinAboveMax() {
        c.setServicePriceMin(new BigDecimal("350000"));
        c.setServicePriceMax(new BigDecimal("400000"));
        assertFalse(CompanionSearchCriteriaMatcher.matches(c, null, null, null, null,
                new BigDecimal("200000"), new BigDecimal("300000")));
    }

    @Test
    void minAndMaxRange_overlap_passes() {
        c.setServicePriceMin(new BigDecimal("200000"));
        c.setServicePriceMax(new BigDecimal("400000"));
        assertTrue(CompanionSearchCriteriaMatcher.matches(c, null, null, null, null,
                new BigDecimal("250000"), new BigDecimal("350000")));
    }

    @Test
    void minAndMaxRange_noOverlap_fails() {
        c.setServicePriceMin(new BigDecimal("200000"));
        c.setServicePriceMax(new BigDecimal("250000"));
        assertFalse(CompanionSearchCriteriaMatcher.matches(c, null, null, null, null,
                new BigDecimal("500000"), new BigDecimal("600000")));
    }

    @Test
    void combinedServiceAreaGenderOnlineAndPrice_passes() {
        assertTrue(CompanionSearchCriteriaMatcher.matches(c,
                "du lịch", "Hà", "Nam", true,
                new BigDecimal("200000"), new BigDecimal("500000")));
    }

    @Test
    void serviceTypeOnCompanionNull_equalsIgnoreCaseBranch() {
        c.setServiceType(null);
        assertFalse(CompanionSearchCriteriaMatcher.matches(c, "Du lịch", null, null, null, null, null));
    }

    @Test
    void servicePriceOnlyMinNull_usesPricePerHourForBothBounds() {
        c.setServicePriceMin(null);
        c.setServicePriceMax(new BigDecimal("400000"));
        c.setPricePerHour(new BigDecimal("300000"));
        assertTrue(CompanionSearchCriteriaMatcher.matches(c, null, null, null, null, new BigDecimal("250000"), null));
    }

    @Test
    void servicePriceOnlyMaxNull_usesPricePerHourForBothBounds() {
        c.setServicePriceMin(new BigDecimal("100000"));
        c.setServicePriceMax(null);
        c.setPricePerHour(new BigDecimal("300000"));
        assertTrue(CompanionSearchCriteriaMatcher.matches(c, null, null, null, null, null, new BigDecimal("350000")));
    }

    @Test
    void bothServicePricesSet_skipsFallbackBlock() {
        c.setServicePriceMin(new BigDecimal("200000"));
        c.setServicePriceMax(new BigDecimal("400000"));
        c.setPricePerHour(new BigDecimal("999999"));
        assertTrue(CompanionSearchCriteriaMatcher.matches(c, null, null, null, null,
                new BigDecimal("250000"), new BigDecimal("350000")));
    }
}
