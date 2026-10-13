import pandas as pd
import numpy as np
import os

CROPS = ['Wheat', 'Rice', 'Corn', 'Soybean', 'Cotton', 'Sugarcane', 'Barley', 'Potato']
REGIONS = ['Midwest Plains', 'Indo-Gangetic Plain', 'California Central Valley', 'Corn Belt', 'Punjab Basin', 'Cerrado', 'Nile Delta', 'East Anglia']
SEASONS = ['Kharif/Monsoon', 'Rabi/Winter', 'Summer/Zaid', 'Spring', 'Autumn']
SOIL_TYPES = ['Clay', 'Loam', 'Sandy Loam', 'Clay Loam', 'Sandy', 'Silt Loam']

# FAO and agronomic reference values for optimal growth conditions
CROP_AGRONOMY = {
    'Wheat': {'base_yield': 3.8, 'opt_temp': 20.0, 'opt_rain': 450.0, 'opt_ph': 6.5, 'n_req': 120, 'p_req': 50, 'k_req': 60, 'soc_sens': 0.15},
    'Rice': {'base_yield': 4.6, 'opt_temp': 28.5, 'opt_rain': 1250.0, 'opt_ph': 6.2, 'n_req': 140, 'p_req': 55, 'k_req': 70, 'soc_sens': 0.12},
    'Corn': {'base_yield': 8.5, 'opt_temp': 26.5, 'opt_rain': 650.0, 'opt_ph': 6.5, 'n_req': 160, 'p_req': 65, 'k_req': 100, 'soc_sens': 0.18},
    'Soybean': {'base_yield': 3.2, 'opt_temp': 25.0, 'opt_rain': 550.0, 'opt_ph': 6.4, 'n_req': 40, 'p_req': 60, 'k_req': 90, 'soc_sens': 0.14},
    'Cotton': {'base_yield': 2.2, 'opt_temp': 29.0, 'opt_rain': 700.0, 'opt_ph': 6.8, 'n_req': 130, 'p_req': 50, 'k_req': 110, 'soc_sens': 0.10},
    'Sugarcane': {'base_yield': 72.0, 'opt_temp': 30.0, 'opt_rain': 1500.0, 'opt_ph': 6.7, 'n_req': 200, 'p_req': 80, 'k_req': 220, 'soc_sens': 0.20},
    'Barley': {'base_yield': 3.5, 'opt_temp': 18.5, 'opt_rain': 400.0, 'opt_ph': 6.8, 'n_req': 90, 'p_req': 45, 'k_req': 50, 'soc_sens': 0.12},
    'Potato': {'base_yield': 22.5, 'opt_temp': 18.0, 'opt_rain': 600.0, 'opt_ph': 5.8, 'n_req': 150, 'p_req': 85, 'k_req': 180, 'soc_sens': 0.22},
}

SOIL_QUALITY_MULTIPLIER = {
    'Loam': 1.15,
    'Silt Loam': 1.10,
    'Clay Loam': 1.05,
    'Clay': 0.95,
    'Sandy Loam': 0.92,
    'Sandy': 0.80
}

def generate_agricultural_dataset(num_samples=2500, output_path=None, seed=42):
    """
    Generates a realistic agricultural dataset following FAO and CGIAR agronomic
    principles and Mitscherlich-Baule nutrient response laws.
    """
    np.random.seed(seed)

    crops_selected = np.random.choice(CROPS, size=num_samples, p=[0.20, 0.20, 0.20, 0.15, 0.08, 0.05, 0.06, 0.06])
    regions_selected = np.random.choice(REGIONS, size=num_samples)
    seasons_selected = np.random.choice(SEASONS, size=num_samples)
    soil_types_selected = np.random.choice(SOIL_TYPES, size=num_samples, p=[0.20, 0.25, 0.18, 0.15, 0.10, 0.12])

    # Soil features
    soil_ph = np.random.normal(loc=6.4, scale=0.8, size=num_samples).clip(4.5, 8.8)
    soil_nitrogen = np.random.normal(loc=110, scale=40, size=num_samples).clip(20.0, 240.0)
    soil_phosphorus = np.random.normal(loc=55, scale=22, size=num_samples).clip(10.0, 120.0)
    soil_potassium = np.random.normal(loc=130, scale=60, size=num_samples).clip(30.0, 380.0)
    soil_organic_carbon = np.random.normal(loc=1.4, scale=0.6, size=num_samples).clip(0.3, 4.2)
    soil_moisture = np.random.normal(loc=35.0, scale=12.0, size=num_samples).clip(10.0, 75.0)

    # Weather features
    temperature = np.random.normal(loc=24.5, scale=6.5, size=num_samples).clip(8.0, 42.0)
    rainfall = np.random.exponential(scale=550.0, size=num_samples) + 120.0
    rainfall = rainfall.clip(60.0, 2400.0)
    humidity = np.random.normal(loc=62.0, scale=16.0, size=num_samples).clip(18.0, 96.0)

    # Farm structure
    area_hectares = np.random.exponential(scale=18.0, size=num_samples) + 1.0
    area_hectares = area_hectares.clip(0.5, 250.0).round(1)

    yields = []

    for i in range(num_samples):
        c = crops_selected[i]
        ag = CROP_AGRONOMY[c]

        # 1. Base potential yield
        base = ag['base_yield']

        # 2. Temperature effect (Gaussian response curve around optimal temperature)
        temp_delta = abs(temperature[i] - ag['opt_temp'])
        temp_factor = np.exp(-0.5 * (temp_delta / 7.0) ** 2)

        # 3. Moisture / Rainfall effect (log-normal response to precipitation)
        rain_ratio = rainfall[i] / ag['opt_rain']
        if rain_ratio < 0.3:
            water_factor = 0.40  # Severe drought
        elif rain_ratio <= 1.3:
            water_factor = 0.5 + 0.5 * (rain_ratio / 1.0) if rain_ratio <= 1.0 else 1.0 - 0.15 * (rain_ratio - 1.0)
        else:
            water_factor = max(0.45, 1.0 - 0.35 * (rain_ratio - 1.3))  # Waterlogging / flood stress

        # 4. Soil pH suitability (bell curve centered at opt_ph)
        ph_delta = abs(soil_ph[i] - ag['opt_ph'])
        ph_factor = np.exp(-0.5 * (ph_delta / 1.2) ** 2)

        # 5. Mitscherlich-Baule law of diminishing returns for N, P, K
        n_ratio = min(1.3, soil_nitrogen[i] / ag['n_req'])
        p_ratio = min(1.3, soil_phosphorus[i] / ag['p_req'])
        k_ratio = min(1.3, soil_potassium[i] / ag['k_req'])

        n_factor = 1.0 - np.exp(-2.5 * n_ratio)
        p_factor = 1.0 - np.exp(-2.2 * p_ratio)
        k_factor = 1.0 - np.exp(-2.0 * k_ratio)
        fertility_factor = (0.5 * n_factor + 0.25 * p_factor + 0.25 * k_factor)

        # 6. Soil Organic Carbon multiplier
        soc_factor = 1.0 + (soil_organic_carbon[i] - 1.0) * ag['soc_sens']
        soc_factor = np.clip(soc_factor, 0.75, 1.40)

        # 7. Soil texture multiplier
        texture_mult = SOIL_QUALITY_MULTIPLIER[soil_types_selected[i]]

        # Combined yield
        calc_yield = base * temp_factor * water_factor * ph_factor * fertility_factor * soc_factor * texture_mult

        # Realistic stochastic biological variation (e.g. pests, microclimates)
        noise_std = base * 0.07
        calc_yield += np.random.normal(0, noise_std)

        # Ensure realistic lower bound (e.g., at least 15% of base yield)
        calc_yield = max(base * 0.15, calc_yield)
        yields.append(round(float(calc_yield), 3))

    df = pd.DataFrame({
        'crop': crops_selected,
        'region': regions_selected,
        'season': seasons_selected,
        'soil_type': soil_types_selected,
        'soil_ph': np.round(soil_ph, 2),
        'soil_nitrogen': np.round(soil_nitrogen, 1),
        'soil_phosphorus': np.round(soil_phosphorus, 1),
        'soil_potassium': np.round(soil_potassium, 1),
        'soil_organic_carbon': np.round(soil_organic_carbon, 2),
        'temperature': np.round(temperature, 1),
        'rainfall': np.round(rainfall, 1),
        'humidity': np.round(humidity, 1),
        'soil_moisture': np.round(soil_moisture, 1),
        'area_hectares': np.round(area_hectares, 1),
        'yield': yields
    })

    if output_path:
        os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
        df.to_csv(output_path, index=False)
        print(f"Agricultural dataset generated successfully: {output_path} ({num_samples} samples)")

    return df

if __name__ == '__main__':
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    ml_path = os.path.join(base_dir, 'ml', 'dataset.csv')
    data_dir_path = os.path.abspath(os.path.join(base_dir, '..', '..', 'data', 'dataset.csv'))
    
    generate_agricultural_dataset(2500, ml_path)
    generate_agricultural_dataset(2500, data_dir_path)
