// AI Prompts Configuration
// Separated from code for easy modification and management

import { CONFIG } from './config';

export const HEURISTICS = `
INDIAN_FOOD_CALORIE_HEURISTICS|v1|2025-12-21
FORMAT food_name|portion_type|calorie_range|description

PROTEINS
white_meat|fist|200-300|cooked_chicken_fish_turkey
red_meat|fist|300-450|cooked_mutton_lamb_goat
hilsa_curry|cup|300-350|bengali_fish
bengali_fish_curry|serving|390-420|rohu_katla_gravy
plain_fish_cooked|100g|110-140|rohu_katla
fish_fry|piece|180-220|medium_fried
prawn_curry|cup|220-280|cooked

boiled_egg|unit|70|whole
fried_egg|unit|100|omelette_scrambled
egg_curry|cup|200-250|1-2_eggs_gravy

paneer_plain|100g|250-280|cottage_cheese
paneer_tikka|skewer|120-150|50g
paneer_makhani|serving|450-500|200-250g_creamy
palak_paneer|cup|280-320|spinach_based
paneer_tikka_masala|cup|330-380|tomato_cream

butter_chicken|cup|360-420|gravy
chicken_curry|cup|280-320|standard_oil
chicken_tikka_masala|cup|330-380|tomato_cream
chicken_korma|cup|420-480|creamy
mutton_curry|cup|350-400|cooked
rogan_josh|cup|415-460|lamb_spiced

LEGUMES_PULSES
dal_plain|cup|200|moong_toor_masoor_no_oil
dal_tadka|cup|220-250|with_tempering_oil
dal_makhani|cup|280-320|creamy_butter
sambar|cup|150-180|south_indian
rasam|cup|80-100|spiced_broth

rajma|cup|220-250|kidney_bean_curry
chole_chana_masala|cup|240-290|cooked
chole_curry|cup|200-230|black_chickpea

VEGETABLES_NON_STARCHY
veg_no_oil|cup|50|lauki_bhindi_cabbage_palak_beans
veg_with_oil|cup|100|same_with_tadka
mixed_veg_curry|cup|120-150|standard_oil
bhindi_fry|cup|150-180|okra
lauki_sabzi|cup|100-130|bottle_gourd

VEGETABLES_STARCHY
potato_corn_noil|cup|100-150|no_oil
potato_corn_oil|cup|150-200|with_oil
aloo_gobi|cup|150-170|cauliflower_potato
aloo_dum|100g|105-130|cooked
fried_potato|cup|200-250|cubed

GRAINS_RICE
rice_cooked|cup|200|white
basmati_rice|cup|200-210|cooked
brown_rice|cup|210-220|cooked
pulao|cup|250-300|vegetable
biryani_veg|cup|300-350|cooked
biryani_chicken|cup|380-435|cooked
biryani_mutton|cup|400-450|cooked
biryani_paneer|cup|350-420|cooked

BREADS_WHEAT
chapati_no_ghee|unit|70-80|phulka
chapati_ghee|unit|100-110|with_ghee
tandoori_roti|unit|80-100|cooked

paratha_plain|unit|100-150|simple
paratha_aloo|unit|150-200|potato_stuffed
paratha_gobi|unit|140-180|cauliflower
paratha_methi|unit|130-170|fenugreek
paratha_malabar|unit|250-300|layered_kerala

puri|unit|100-150|deep_fried_medium
luchi_bengali|unit|85-90|bengali_puri

naan_plain|unit|200-250|tandoor
naan_butter|unit|250-350|with_ghee
naan_garlic|unit|240-320|with_garlic

bread_slice|unit|70-120|white_atta

SOUTH_INDIAN
idli|unit|50-60|steamed
idli_sambar|plate|180-220|2_idli_1cup_sambar
dosa_homemade|unit|100-150|plain
dosa_masala_home|unit|150-220|with_filling
dosa_restaurant|unit|300-400|large_fried
medu_vada|unit|150-180|lentil_donut
upma|cup|150-180|semolina
uttapam|unit|100-130|pancake_style

BEVERAGES
milk|cup|100-150|no_sugar
milk_sugar|cup|150-200|with_sugar
curd_plain|cup|120-150|yogurt
curd_sweetened|cup|200-250|mishti_doi

tea_coffee_milk|cup|20-40|no_sugar
tea_coffee_milk_sugar|cup|80-120|with_sugar
juice_fresh|cup|100-150|natural
juice_packaged|cup|120-180|sugary
buttermilk|cup|80-100|chaas
coconut_water|cup|45-60|natural

FRUITS
banana|unit|75-125|medium
apple|unit|95-100|medium
orange|unit|60-85|medium
guava|unit|40-60|medium
papaya|cup|55-60|cubed
mango|unit|135-165|medium
watermelon|cup|45-50|cubed
grapes|cup|90-100|bunch
pomegranate|cup|140-150|arils
generic_fruit|unit|100|medium_heuristic

SNACKS_STREET_FOOD
samosa|unit|150-200|medium
samosa_large|unit|250-300|large
pakora_veg|unit|80-120|mixed_piece
pakora_bhajiya|100g|300|weight_based
aloo_tikki|unit|120-180|potato
vada_pav|unit|200-250|complete

pani_puri|plate|180-220|6_pieces
bhel_puri|plate|285-320|complete
sev_puri|plate|250-300|complete
chaat|plate|200-300|generic

fries|serving|400-430|medium
chips|packet|120-150|30g
biscuit_plain|unit|40-80|single

SWEETS_DESSERTS
jalebi_large|unit|200-250|piece
jalebi_small|unit|150-180|piece
gulab_jamun|unit|150-200|single
rasgulla|unit|80-100|single
rasmalai|unit|150-180|single
sandesh|unit|100-150|bengali
barfi|unit|200-250|kaju_coconut_milk
laddu|unit|150-200|besan_boondi

kheer|cup|300-350|rice_pudding
payesh_bengali|cup|280-320|bengali_style
halwa_carrot|serving|350-400|gajar_ka
halwa_suji|30g|100|semolina
kulfi|unit|200-250|single
ice_cream|cup|250-400|standard

OILS_FATS
oil_ghee_butter|tbsp|130|cooking
oil_ghee_butter|tsp|45|cooking

CONDIMENTS
pickle|tbsp|30-50|achar
chutney_coconut|quarter_cup|80-100|fresh
chutney_peanut|tbsp|100-120|2tbsp

MEAL_COMBINATIONS
thali_veg|plate|600-800|dal_rice_veg_bread
thali_light|plate|400-550|dal_bread_salad
meal_chicken_rice|plate|700-900|curry_rice_bread
meal_fish_rice|plate|600-750|curry_rice
biryani_chicken|unit|380-435|single_cup
biryani_platter|unit|500-600|restaurant_portion
butter_chicken_naan|plate|860-1050|2_naan

MODIFIERS
restaurant_multiplier|factor|2.0-2.5|vs_homemade
oil_light|factor|0.8|vs_standard
oil_heavy|factor|1.3|vs_standard
portion_small|factor|0.7|vs_medium
portion_large|factor|1.5|vs_medium
`;

// Mode-specific instructions for the AI
export const MODE_INSTRUCTIONS = {
  [CONFIG.MODES.LIGHT]: `
COOKING ASSUMPTION: Light/Healthy preparation
- Assume NO oil or minimal oil (baked, boiled, steamed, air-fried)
- Use the LOWER BOUND of all calorie ranges
- Assume smaller portion sizes
- Assume no extra ghee, butter, or cream
- Reduce calorie estimates by 20-30% from standard values
- Example: A dosa would be 100 calories (plain, no oil) not 300+ (restaurant style)
`,

  [CONFIG.MODES.HOMEMADE]: `
COOKING ASSUMPTION: Standard home cooking
- Assume moderate oil usage (1-2 tsp per serving)
- Assume no extra ghee, butter, or cream
- Use the MIDDLE/AVERAGE of calorie ranges
- Assume standard home portion sizes
- Standard tempering (tadka) with reasonable oil
- This is the baseline - no multipliers applied
- Example: A dosa would be 150-180 calories (homemade with moderate oil)
`,

  [CONFIG.MODES.RESTAURANT]: `
COOKING ASSUMPTION: Restaurant/Outside food preparation
- Assume HIGH oil, butter, ghee, and cream usage
- Use the UPPER BOUND of all calorie ranges, then apply 1.5-2x multiplier
- Assume generous restaurant portion sizes (often 1.5x home portions)
- Heavy use of refined oils, butter finishes, cream-based gravies
- Add extra calories for hidden fats (naan brushed with butter, rice cooked in ghee)
- Example: A dosa would be 350-450 calories (restaurant style, lots of oil, large size)
`,
};

// Main system prompt for food analysis
// NOTE: JSON format is now enforced by responseSchema in geminiService
export const getSystemPrompt = (mode: string) => `
You are an expert Indian food nutritionist and calorie estimator. Your task is to analyze food images and estimate calories accurately for Indian cuisine.

${MODE_INSTRUCTIONS[mode] || MODE_INSTRUCTIONS[CONFIG.MODES.HOMEMADE]}

REFERENCE HEURISTICS (use these as baseline, adjust based on cooking mode):
${HEURISTICS}

ANALYSIS INSTRUCTIONS:
1. Identify ALL food items visible in the image
2. Estimate portion sizes (use common measures: cup, piece, serving, plate)
3. Apply the cooking mode assumptions to adjust calorie estimates
4. For mixed dishes, break down components if possible
5. Consider visible oil/grease, portion size, and presentation style
6. Set success to true if food is identified, false otherwise
7. Provide Hindi/regional names when you know them
8. Set confidence to "high" for common dishes, "medium" for estimates, "low" for uncertain
`;

// User prompt template
// NOTE: JSON output is guaranteed by responseSchema
export const getUserPrompt = (mode: string) => `
Analyze this food image and estimate the calories.
Current mode: ${mode.toUpperCase()}
Apply the ${mode} cooking assumptions as instructed.
`;

export default {
  HEURISTICS,
  MODE_INSTRUCTIONS,
  getSystemPrompt,
  getUserPrompt,
};
