# QuantumYield AI — Agricultural Dataset Documentation

## Overview & Provenance
This dataset supports agricultural yield estimation experiments benchmarking Classical Machine Learning against Quantum Machine Learning (QML) fidelity kernels. 

- **Primary Source / Ground Truth Calibration:** Calibrated against FAOSTAT (Food and Agriculture Organization of the United Nations) yield benchmarks, CGIAR crop growth models, and the Mitscherlich-Baule law of soil nutrient response.
- **Dataset Size:** 2,500 observation records across 8 major agricultural crops.
- **License:** Open Access / CC-BY-4.0 & CC0 compatible for academic and research evaluation.

## Feature Dictionary

| Feature Name | Type | Units | Valid Range | Agronomic Significance |
|---|---|---|---|---|
| `crop` | Categorical | - | Wheat, Rice, Corn, Soybean, Cotton, Sugarcane, Barley, Potato | Target crop variety |
| `region` | Categorical | - | 8 global agro-ecological zones | Regional climate and terrain context |
| `season` | Categorical | - | Kharif/Monsoon, Rabi/Winter, Summer/Zaid, Spring, Autumn | Cropping calendar cycle |
| `soil_type` | Categorical | - | Clay, Loam, Sandy Loam, Clay Loam, Sandy, Silt Loam | Soil texture & water retention index |
| `soil_ph` | Numeric | pH scale | 4.5 – 8.8 | Acidity/alkalinity influencing nutrient availability |
| `soil_nitrogen` | Numeric | kg/ha | 20.0 – 240.0 | Primary macronutrient for vegetative growth |
| `soil_phosphorus` | Numeric | kg/ha | 10.0 – 120.0 | Essential for root establishment & flowering |
| `soil_potassium` | Numeric | kg/ha | 30.0 – 380.0 | Enzyme activation, stomatal control & disease resistance |
| `soil_organic_carbon` | Numeric | % (w/w) | 0.3 – 4.2 | Soil biology indicator & carbon sequestration |
| `temperature` | Numeric | °C | 8.0 – 42.0 | Mean ambient growing season temperature |
| `rainfall` | Numeric | mm | 60.0 – 2400.0 | Cumulative growing season precipitation |
| `humidity` | Numeric | % | 18.0 – 96.0 | Mean relative humidity |
| `soil_moisture` | Numeric | % | 10.0 – 75.0 | Volumetric soil water content |
| `area_hectares` | Numeric | ha | 0.5 – 250.0 | Total cultivated plot surface |
| `yield` | Numeric (Target) | metric tons/ha | 0.4 – 95.0 | Output harvest yield per unit area |

## Preprocessing & Pipeline Integrity
1. **Train/Test Splitting:** Fixed random seed `42` with 80/20 train/test split.
2. **Leakage Prevention:** All `StandardScaler` (for continuous variables) and `OneHotEncoder` (for categorical variables) transformations are fit strictly on training splits.
3. **Quantum Preprocessing:** For quantum fidelity kernel evaluation, numerical features undergo dimensionality reduction via Principal Component Analysis (PCA) to $d=4$ components scaled to $[0, \pi]$ intervals to avoid gate phase wrapping.
