from typing import Dict, Any, List

CROP_AGRONOMIC_STANDARDS: Dict[str, Dict[str, Any]] = {
    'Wheat': {
        'ph_range': (6.0, 7.5),
        'opt_temp_range': (15.0, 24.0),
        'opt_water_mm': (350.0, 600.0),
        'n_demand_kgha': (100.0, 150.0),
        'p_demand_kgha': (40.0, 65.0),
        'k_demand_kgha': (50.0, 80.0),
        'critical_stage': 'Crown root initiation & Grain filling',
        'citation': 'FAO Irrigation and Drainage Paper 56 / ICAR Wheat Agronomy'
    },
    'Rice': {
        'ph_range': (5.5, 7.0),
        'opt_temp_range': (22.0, 32.0),
        'opt_water_mm': (1000.0, 1600.0),
        'n_demand_kgha': (120.0, 160.0),
        'p_demand_kgha': (40.0, 60.0),
        'k_demand_kgha': (60.0, 90.0),
        'critical_stage': 'Panicle initiation & Flowering',
        'citation': 'IRRI Rice Knowledge Bank / FAO Crop Water Management'
    },
    'Corn': {
        'ph_range': (5.8, 7.2),
        'opt_temp_range': (20.0, 30.0),
        'opt_water_mm': (500.0, 800.0),
        'n_demand_kgha': (140.0, 200.0),
        'p_demand_kgha': (50.0, 80.0),
        'k_demand_kgha': (80.0, 140.0),
        'critical_stage': 'Silking & Tasseling',
        'citation': 'USDA-ARS Corn Production Handbook'
    },
    'Soybean': {
        'ph_range': (6.0, 7.0),
        'opt_temp_range': (20.0, 28.0),
        'opt_water_mm': (450.0, 700.0),
        'n_demand_kgha': (30.0, 60.0),  # N-fixing legume
        'p_demand_kgha': (45.0, 75.0),
        'k_demand_kgha': (70.0, 120.0),
        'critical_stage': 'Pod development & Seed filling',
        'citation': 'Purdue Extension Soybean Field Guide'
    },
    'Cotton': {
        'ph_range': (6.2, 7.8),
        'opt_temp_range': (24.0, 34.0),
        'opt_water_mm': (600.0, 950.0),
        'n_demand_kgha': (110.0, 160.0),
        'p_demand_kgha': (40.0, 65.0),
        'k_demand_kgha': (90.0, 150.0),
        'critical_stage': 'Square formation & Boll opening',
        'citation': 'Cotton Research and Development Corporation (CRDC)'
    },
    'Sugarcane': {
        'ph_range': (6.0, 7.5),
        'opt_temp_range': (25.0, 35.0),
        'opt_water_mm': (1300.0, 2200.0),
        'n_demand_kgha': (180.0, 250.0),
        'p_demand_kgha': (70.0, 100.0),
        'k_demand_kgha': (180.0, 260.0),
        'critical_stage': 'Formative tillering & Grand growth phase',
        'citation': 'Sugarcane Breeding Institute / FAO Land & Water'
    },
    'Barley': {
        'ph_range': (6.2, 7.8),
        'opt_temp_range': (14.0, 22.0),
        'opt_water_mm': (300.0, 500.0),
        'n_demand_kgha': (70.0, 110.0),
        'p_demand_kgha': (35.0, 55.0),
        'k_demand_kgha': (40.0, 70.0),
        'critical_stage': 'Tillering & Heading',
        'citation': 'FAO ECOCROP Database'
    },
    'Potato': {
        'ph_range': (5.2, 6.5),
        'opt_temp_range': (15.0, 22.0),
        'opt_water_mm': (500.0, 750.0),
        'n_demand_kgha': (130.0, 180.0),
        'p_demand_kgha': (70.0, 110.0),
        'k_demand_kgha': (150.0, 240.0),
        'critical_stage': 'Tuber initiation & Bulking',
        'citation': 'CIP (International Potato Center) Agronomy Manual'
    }
}


def generate_agronomic_recommendations(inputs: Dict[str, Any], predicted_yield: float) -> Dict[str, Any]:
    """
    Transparent rule-based agronomic advisory derived strictly from crop soil
    and meteorological inputs vs verified FAO / ICAR crop standards.
    """
    crop = inputs.get('crop', 'Wheat')
    std = CROP_AGRONOMIC_STANDARDS.get(crop, CROP_AGRONOMIC_STANDARDS['Wheat'])

    ph = float(inputs.get('soil_ph', 6.5))
    n = float(inputs.get('soil_nitrogen', 100))
    p = float(inputs.get('soil_phosphorus', 50))
    k = float(inputs.get('soil_potassium', 100))
    soc = float(inputs.get('soil_organic_carbon', 1.2))
    temp = float(inputs.get('temperature', 24.0))
    rain = float(inputs.get('rainfall', 500.0))
    moisture = float(inputs.get('soil_moisture', 35.0))
    area = float(inputs.get('area_hectares', 1.0))

    recommendations: List[Dict[str, str]] = []

    # 1. Soil pH Suitability
    min_ph, max_ph = std['ph_range']
    if ph < min_ph:
        deficit = round(min_ph - ph, 2)
        recommendations.append({
            'category': 'Soil Acidity Alert',
            'severity': 'warning' if deficit < 0.8 else 'high',
            'observation': f'Soil pH ({ph}) is acidic and below the optimal threshold ({min_ph} - {max_ph}) for {crop}.',
            'action': f'Apply agricultural lime (calcite or dolomite) to neutralize soil acidity and unlock phosphorus availability.',
            'scientific_rationale': 'Low pH causes aluminum toxicity and binds orthophosphate into insoluble iron/aluminum phosphates.'
        })
    elif ph > max_ph:
        excess = round(ph - max_ph, 2)
        recommendations.append({
            'category': 'Soil Alkalinity Alert',
            'severity': 'warning' if excess < 0.8 else 'high',
            'observation': f'Soil pH ({ph}) is alkaline and above the recommended threshold ({min_ph} - {max_ph}) for {crop}.',
            'action': f'Apply gypsum (calcium sulfate) or elemental sulfur; incorporate organic compost to buffer root-zone pH.',
            'scientific_rationale': 'Alkaline pH precipitates zinc, iron, and manganese into insoluble oxides, risking chlorosis.'
        })
    else:
        recommendations.append({
            'category': 'Soil Reaction (pH)',
            'severity': 'optimal',
            'observation': f'Soil pH ({ph}) is within the prime agronomic window ({min_ph} - {max_ph}) for {crop}.',
            'action': 'Maintain current soil amendment practices.',
            'scientific_rationale': 'Nutrient availability indices for N, P, K, Ca, and Mg are maximized in this range.'
        })

    # 2. Nutrient Diagnostics (N, P, K)
    n_min, n_max = std['n_demand_kgha']
    if n < n_min:
        recommendations.append({
            'category': 'Nitrogen (N) Deficiency',
            'severity': 'warning',
            'observation': f'Soil Nitrogen level ({n:.1f} kg/ha) is below recommended demand ({n_min:.0f} - {n_max:.0f} kg/ha).',
            'action': f'Supplement with split-dose nitrogen fertilizer (urea or calcium ammonium nitrate) during vegetative growth.',
            'scientific_rationale': 'Nitrogen is the core structural element of chlorophyll; deficiency limits vegetative canopy expansion.'
        })
    elif n > n_max * 1.3:
        recommendations.append({
            'category': 'Excessive Nitrogen',
            'severity': 'caution',
            'observation': f'Soil Nitrogen ({n:.1f} kg/ha) is well above standard requirements ({n_min:.0f} - {n_max:.0f} kg/ha).',
            'action': 'Halt supplemental nitrogen applications to avoid excessive vegetative lodging and disease susceptibility.',
            'scientific_rationale': 'Excess N causes succulent stem elongation, lodging risk, and nitrate leaching into groundwater.'
        })

    p_min, p_max = std['p_demand_kgha']
    if p < p_min:
        recommendations.append({
            'category': 'Phosphorus (P) Deficiency',
            'severity': 'warning',
            'observation': f'Soil Phosphorus ({p:.1f} kg/ha) is deficient for {crop} (target: {p_min:.0f} - {p_max:.0f} kg/ha).',
            'action': 'Apply basal phosphatic fertilizer (DAP or Single Superphosphate) placed close to seed depth during sowing.',
            'scientific_rationale': 'Phosphorus drives ATP energy transfer and initial root architecture development.'
        })

    k_min, k_max = std['k_demand_kgha']
    if k < k_min:
        recommendations.append({
            'category': 'Potassium (K) Deficiency',
            'severity': 'warning',
            'observation': f'Soil Potassium ({k:.1f} kg/ha) is below optimal crop threshold ({k_min:.0f} - {k_max:.0f} kg/ha).',
            'action': 'Incorporate Muriate of Potash (MOP) or Potassium Sulfate to fortify stomatal regulation and drought resilience.',
            'scientific_rationale': 'Potassium regulates stomatal conductance, osmotic pressure, and plant disease resistance.'
        })

    # 3. Water Balance & Irrigation
    w_min, w_max = std['opt_water_mm']
    if rain < w_min * 0.7 or moisture < 20.0:
        recommendations.append({
            'category': 'Hydrological Deficit / Irrigation Needed',
            'severity': 'high',
            'observation': f'Growing season rainfall ({rain:.0f} mm) & soil moisture ({moisture:.1f}%) indicate moisture deficit vs crop need ({w_min:.0f} - {w_max:.0f} mm).',
            'action': f'Schedule supplemental irrigation during critical developmental phases: {std["critical_stage"]}.',
            'scientific_rationale': 'Water stress during reproductive stages causes pollen sterility and abortion of grain/fruit sets.'
        })
    elif rain > w_max * 1.35 or moisture > 65.0:
        recommendations.append({
            'category': 'Waterlogging & Aeration Risk',
            'severity': 'warning',
            'observation': f'Cumulative moisture ({rain:.0f} mm rain, {moisture:.1f}% soil moisture) exceeds optimal tolerance ({w_max:.0f} mm).',
            'action': 'Ensure active field drainage furrows to avert root asphyxiation and damping-off fungal pathogens.',
            'scientific_rationale': 'Saturated soil deprives roots of oxygen, leading to anaerobic denitrification and root rot.'
        })

    # 4. Thermal Comfort
    t_min, t_max = std['opt_temp_range']
    if temp < t_min - 3.0:
        recommendations.append({
            'category': 'Cold Stress',
            'severity': 'warning',
            'observation': f'Average temperature ({temp:.1f}°C) is below thermal comfort ({t_min:.1f} - {t_max:.1f}°C).',
            'action': 'Consider mulch covering or delay planting window if cold snaps threaten germination.',
            'scientific_rationale': 'Low temperatures suppress enzyme kinetics and metabolic growth rates.'
        })
    elif temp > t_max + 3.0:
        recommendations.append({
            'category': 'Heat Stress Alert',
            'severity': 'high',
            'observation': f'Average temperature ({temp:.1f}°C) surpasses thermal maximum threshold ({t_max:.1f}°C).',
            'action': 'Deploy micro-sprinklers or maintain soil moisture to facilitate evaporative canopy cooling.',
            'scientific_rationale': 'Elevated heat during anthesis disrupts pollen viability and triggers premature senescence.'
        })

    # 5. Soil Organic Carbon
    if soc < 0.75:
        recommendations.append({
            'category': 'Soil Carbon Depletion',
            'severity': 'warning',
            'observation': f'Soil Organic Carbon ({soc:.2f}%) is low (< 0.75%), limiting microbial biomass and cation exchange.',
            'action': 'Adopt conservation tillage, incorporate green manure cover crops, and apply well-rotted farmyard manure.',
            'scientific_rationale': 'SOC enhances water-holding capacity and stabilizes soil aggregates against erosion.'
        })
    elif soc >= 1.5:
        recommendations.append({
            'category': 'Soil Organic Health',
            'severity': 'optimal',
            'observation': f'Soil Organic Carbon ({soc:.2f}%) indicates robust soil biological fertility and buffer capacity.',
            'action': 'Continue sustainable organic residue recycling.',
            'scientific_rationale': 'High SOC facilitates superior nutrient mineralization and moisture retention.'
        })

    total_yield_tons = round(predicted_yield * area, 2)

    return {
        'crop': crop,
        'agronomic_standard': std,
        'total_farm_yield_tons': total_yield_tons,
        'cultivated_area_ha': area,
        'recommendations': recommendations,
        'disclaimer': (
            "Agronomic guidance is generated via rule-based comparison against FAO and ICAR reference standards. "
            "These suggestions represent decision-support guidance and should be verified with local agronomists "
            "prior to commercial agrochemical application."
        )
    }
