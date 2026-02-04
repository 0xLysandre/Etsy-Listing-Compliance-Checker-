import { db, pool } from './index.js';
import { policyRules, violations, violationChecks } from './schema.js';
import type { Severity } from './schema.js';

const policyRulesData: {
  category: string;
  ruleName: string;
  ruleText: string;
  severity: Severity;
  keywords: string[];
}[] = [
  // ============================================
  // PROHIBITED ITEMS (HIGH/CRITICAL Severity)
  // ============================================
  {
    category: 'prohibited_items',
    ruleName: 'Trademarked Terms Without Authorization',
    ruleText: 'Listings containing trademarked brand names or terms without proper authorization are prohibited. This includes using brand names to describe style or fit.',
    severity: 'HIGH',
    keywords: [
      'nike', 'adidas', 'disney', 'marvel', 'dc comics', 'gucci', 'louis vuitton',
      'chanel', 'prada', 'hermes', 'rolex', 'cartier', 'tiffany', 'coach',
      'michael kors', 'kate spade', 'burberry', 'versace', 'fendi', 'dior',
      'ysl', 'saint laurent', 'balenciaga', 'bottega veneta', 'supreme',
      'off-white', 'bape', 'stussy', 'champion', 'north face', 'patagonia',
      'harry potter', 'star wars', 'pokemon', 'nintendo', 'playstation', 'xbox',
      'minecraft', 'fortnite', 'roblox', 'among us', 'hello kitty', 'sanrio',
      'coca-cola', 'pepsi', 'starbucks', 'mcdonalds', 'apple', 'google',
      'nfl', 'nba', 'mlb', 'nhl', 'fifa', 'ufc', 'wwe', 'olympics'
    ],
  },
  {
    category: 'prohibited_items',
    ruleName: 'Alcohol, Tobacco, or Drug Paraphernalia',
    ruleText: 'Etsy prohibits the sale of alcohol, tobacco products, and drug paraphernalia. This includes items designed for drug use.',
    severity: 'CRITICAL',
    keywords: [
      'wine', 'vodka', 'whiskey', 'beer', 'liquor', 'alcohol', 'bourbon', 'rum',
      'cigarette', 'tobacco', 'cigar', 'vape', 'e-cigarette', 'nicotine', 'juul',
      'bong', 'pipe', 'grinder', 'rolling papers', 'roach clip', 'dab rig',
      'marijuana', 'cannabis', 'weed', 'thc', 'cbd', '420', 'stoner'
    ],
  },
  {
    category: 'prohibited_items',
    ruleName: 'Medical Items Requiring Licenses',
    ruleText: 'Medical devices, prescription medications, and items requiring medical licenses are prohibited without proper authorization.',
    severity: 'CRITICAL',
    keywords: [
      'prescription', 'medicine', 'medication', 'surgical', 'diagnosis', 'medical device',
      'pharmaceutical', 'drug', 'treatment', 'cure', 'healing', 'therapy device',
      'blood pressure', 'insulin', 'oxygen', 'cpap', 'medical grade', 'fda approved',
      'diagnostic', 'clinical', 'hospital grade', 'medical equipment'
    ],
  },
  {
    category: 'prohibited_items',
    ruleName: 'Weapons or Weapon Replicas',
    ruleText: 'Etsy prohibits the sale of weapons, firearms, ammunition, and realistic weapon replicas that could be mistaken for real weapons.',
    severity: 'CRITICAL',
    keywords: [
      'gun', 'firearm', 'rifle', 'pistol', 'revolver', 'ammunition', 'ammo', 'bullet',
      'knife', 'switchblade', 'butterfly knife', 'throwing star', 'brass knuckles',
      'sword', 'machete', 'dagger', 'stiletto', 'weapon', 'taser', 'stun gun',
      'pepper spray', 'mace', 'crossbow', 'replica weapon', 'airsoft', 'bb gun',
      'silencer', 'suppressor', 'high capacity magazine'
    ],
  },
  {
    category: 'prohibited_items',
    ruleName: 'Hate Group Symbols and Nazi Memorabilia',
    ruleText: 'Items promoting hate groups, Nazi imagery, or symbols of white supremacy and racism are strictly prohibited.',
    severity: 'CRITICAL',
    keywords: [
      'swastika', 'nazi', 'ss', 'confederate flag', 'kkk', 'ku klux klan',
      'white power', 'white supremacy', 'aryan', 'neo-nazi', 'third reich',
      'hitler', 'holocaust denial', 'hate group', 'racist symbol'
    ],
  },
  {
    category: 'prohibited_items',
    ruleName: 'Human Remains and Body Parts',
    ruleText: 'Sale of human remains, body parts, or bodily fluids is strictly prohibited.',
    severity: 'CRITICAL',
    keywords: [
      'human bone', 'human skull', 'human teeth', 'human hair extensions',
      'body parts', 'bodily fluids', 'blood', 'organs', 'human tissue'
    ],
  },

  // ============================================
  // RESTRICTED ITEMS (MEDIUM Severity)
  // ============================================
  {
    category: 'restricted_items',
    ruleName: 'Dropshipping or Reselling Prohibited',
    ruleText: 'Etsy is a marketplace for handmade, vintage, and craft supplies. Dropshipping mass-produced items or reselling from other retailers is not allowed.',
    severity: 'MEDIUM',
    keywords: [
      'dropship', 'dropshipping', 'wholesale', 'aliexpress', 'alibaba', 'amazon',
      'reseller', 'reselling', 'bulk order', 'bulk purchase', 'direct from factory',
      'supplier', 'distributor', 'print on demand', 'pod', 'fulfillment center'
    ],
  },
  {
    category: 'restricted_items',
    ruleName: 'Mass-Produced Items Not Handmade',
    ruleText: 'Items listed as handmade must be made or designed by the seller. Mass-produced factory items cannot be listed as handmade.',
    severity: 'MEDIUM',
    keywords: [
      'mass-produced', 'mass produced', 'factory-made', 'factory made', 'machine made',
      'manufactured', 'industrial', 'commercial production', 'assembly line',
      'imported from china', 'imported goods', 'ready-made', 'pre-made'
    ],
  },
  {
    category: 'restricted_items',
    ruleName: 'Endangered Species Materials',
    ruleText: 'Products made from endangered species or their parts are prohibited under CITES regulations.',
    severity: 'HIGH',
    keywords: [
      'ivory', 'tortoiseshell', 'tortoise shell', 'coral', 'real fur', 'animal fur',
      'exotic leather', 'crocodile', 'alligator', 'python', 'snake skin',
      'elephant', 'rhino', 'tiger', 'leopard', 'whale bone', 'shark fin'
    ],
  },
  {
    category: 'restricted_items',
    ruleName: 'Mature Content Without Proper Tags',
    ruleText: 'Adult or mature content must be properly tagged and categorized. Explicit content without proper mature tags violates Etsy policies.',
    severity: 'MEDIUM',
    keywords: [
      'explicit', 'adult', 'nude', 'nudity', 'sexual', 'erotic', 'xxx',
      'nsfw', 'pornographic', 'bdsm', 'fetish', 'sex toy', 'vibrator',
      'lingerie', 'adult content', '18+', 'mature content'
    ],
  },
  {
    category: 'restricted_items',
    ruleName: 'Recalled Products',
    ruleText: 'Products that have been recalled by manufacturers or government agencies cannot be sold.',
    severity: 'HIGH',
    keywords: [
      'recalled', 'recall notice', 'safety recall', 'product recall',
      'cpsc recall', 'fda recall', 'banned product'
    ],
  },

  // ============================================
  // POLICY VIOLATIONS (MEDIUM Severity)
  // ============================================
  {
    category: 'policy_violations',
    ruleName: 'False Vintage Claims',
    ruleText: 'Items labeled as vintage must be at least 20 years old. Misrepresenting newer items as vintage is prohibited.',
    severity: 'MEDIUM',
    keywords: [
      'vintage style', 'vintage look', 'vintage inspired', 'retro style',
      'antique style', 'vintage reproduction', 'faux vintage', 'fake vintage'
    ],
  },
  {
    category: 'policy_violations',
    ruleName: 'Misleading Handmade Claims',
    ruleText: 'Claiming items are handmade when they are factory-produced or purchased for resale is a violation of Etsy policies.',
    severity: 'HIGH',
    keywords: [
      'handmade', 'hand made', 'hand-crafted', 'handcrafted', 'artisan',
      'factory', 'manufactured', 'machine-made', 'imported', 'outsourced'
    ],
  },
  {
    category: 'policy_violations',
    ruleName: 'Prohibited Keywords in Tags',
    ruleText: 'Using prohibited, spammy, or irrelevant keywords in tags to manipulate search results is not allowed.',
    severity: 'LOW',
    keywords: [
      'hashtag', '#', 'sex', 'porn', 'xxx', 'free shipping', 'best seller',
      'top rated', 'amazon', 'ebay', 'etsy', 'trending', 'viral', 'tiktok'
    ],
  },
  {
    category: 'policy_violations',
    ruleName: 'Fee Avoidance',
    ruleText: 'Attempting to avoid Etsy fees by directing customers to purchase outside of Etsy is prohibited.',
    severity: 'HIGH',
    keywords: [
      'contact me directly', 'message for discount', 'pay outside etsy',
      'venmo', 'paypal direct', 'cash app', 'zelle', 'off-platform',
      'dm for price', 'dm to order', 'buy direct'
    ],
  },
  {
    category: 'policy_violations',
    ruleName: 'Counterfeit Items',
    ruleText: 'Selling counterfeit or fake branded items is illegal and strictly prohibited.',
    severity: 'CRITICAL',
    keywords: [
      'replica', 'knockoff', 'fake', 'counterfeit', 'imitation', 'dupe',
      'inspired by', 'designer inspired', 'look alike', 'aaa quality',
      '1:1', 'mirror quality', 'unauthorized'
    ],
  },

  // ============================================
  // TITLE/DESCRIPTION ISSUES (LOW Severity)
  // ============================================
  {
    category: 'listing_quality',
    ruleName: 'Excessive Keyword Stuffing',
    ruleText: 'Repeating keywords excessively in titles or descriptions to manipulate search is considered spam and reduces listing quality.',
    severity: 'LOW',
    keywords: [], // Detected programmatically
  },
  {
    category: 'listing_quality',
    ruleName: 'Special Characters in Title',
    ruleText: 'Using excessive special characters, emojis, or symbols in titles can reduce visibility and violates best practices.',
    severity: 'LOW',
    keywords: [
      '★', '✨', '♥', '➡', '❤', '⭐', '✓', '♡', '☆', '●', '◆', '■',
      '►', '◄', '▲', '▼', '⬆', '⬇', '➤', '→', '←', '↑', '↓',
      '!!!', '???', '***', '---', '===', '~~~'
    ],
  },
  {
    category: 'listing_quality',
    ruleName: 'Missing Required Information',
    ruleText: 'Listings should include complete information such as materials, dimensions, and care instructions where applicable.',
    severity: 'LOW',
    keywords: [], // Detected programmatically
  },
  {
    category: 'listing_quality',
    ruleName: 'External Links in Description',
    ruleText: 'Including external website links in descriptions may violate Etsy policies and redirect customers away from Etsy.',
    severity: 'MEDIUM',
    keywords: [
      'http://', 'https://', 'www.', '.com', '.net', '.org', '.co',
      'click here', 'visit my website', 'shop at', 'buy at', 'order at'
    ],
  },
  {
    category: 'listing_quality',
    ruleName: 'ALL CAPS in Title',
    ruleText: 'Using ALL CAPS in titles is considered shouting and reduces professionalism. Use proper capitalization.',
    severity: 'LOW',
    keywords: [], // Detected programmatically
  },
  {
    category: 'listing_quality',
    ruleName: 'Price Manipulation',
    ruleText: 'Artificially inflating prices to make discounts appear larger or misleading pricing practices are not allowed.',
    severity: 'MEDIUM',
    keywords: [
      'was $', 'originally $', 'compare at', 'retail value', 'msrp',
      '% off', 'save $', 'discount', 'sale price', 'reduced'
    ],
  },

  // ============================================
  // SHIPPING & DELIVERY ISSUES
  // ============================================
  {
    category: 'shipping',
    ruleName: 'Unrealistic Processing Times',
    ruleText: 'Processing times must be accurate. Advertising faster times than you can deliver is misleading.',
    severity: 'MEDIUM',
    keywords: [
      'ships same day', 'instant shipping', 'ships immediately',
      '24 hour shipping', 'next day delivery', 'rush order'
    ],
  },
  {
    category: 'shipping',
    ruleName: 'Hidden Shipping Costs',
    ruleText: 'Charging excessive shipping fees that exceed actual costs is considered a policy violation.',
    severity: 'MEDIUM',
    keywords: [
      'shipping extra', 'shipping not included', 'contact for shipping',
      'shipping varies', 'calculated shipping'
    ],
  },

  // ============================================
  // SAFETY CONCERNS
  // ============================================
  {
    category: 'safety',
    ruleName: 'Children Product Safety',
    ruleText: 'Products for children must meet safety standards (CPSIA). Small parts, sharp edges, and toxic materials are prohibited in children\'s items.',
    severity: 'CRITICAL',
    keywords: [
      'for kids', 'children', 'baby', 'infant', 'toddler', 'nursery',
      'child safe', 'kid friendly', 'ages 0-3', 'newborn', 'child'
    ],
  },
  {
    category: 'safety',
    ruleName: 'Food Safety Requirements',
    ruleText: 'Food items must include ingredient lists, allergen warnings, and comply with food safety regulations.',
    severity: 'HIGH',
    keywords: [
      'edible', 'food', 'consumable', 'eat', 'candy', 'chocolate', 'baked goods',
      'cookies', 'cake', 'snack', 'ingredient', 'allergen', 'contains nuts',
      'gluten free', 'vegan food', 'organic food'
    ],
  },
  {
    category: 'safety',
    ruleName: 'Cosmetics and Skincare Compliance',
    ruleText: 'Cosmetics and skincare products must list all ingredients and comply with FDA regulations.',
    severity: 'MEDIUM',
    keywords: [
      'skincare', 'cosmetic', 'lotion', 'cream', 'serum', 'face mask',
      'lip balm', 'soap', 'shampoo', 'conditioner', 'moisturizer',
      'anti-aging', 'acne treatment', 'skin treatment'
    ],
  },
  {
    category: 'safety',
    ruleName: 'Candle and Home Fragrance Safety',
    ruleText: 'Candles and home fragrance products should include safety warnings and proper usage instructions.',
    severity: 'MEDIUM',
    keywords: [
      'candle', 'wax melt', 'incense', 'essential oil', 'diffuser',
      'fragrance oil', 'scented', 'aromatherapy', 'burn time'
    ],
  },

  // ============================================
  // DIGITAL PRODUCTS
  // ============================================
  {
    category: 'digital_products',
    ruleName: 'Digital Product Clarity',
    ruleText: 'Digital products must clearly state that no physical item will be shipped. Customers must understand what they\'re purchasing.',
    severity: 'MEDIUM',
    keywords: [
      'digital download', 'instant download', 'printable', 'pdf',
      'no physical item', 'digital file', 'digital product', 'e-book'
    ],
  },
  {
    category: 'digital_products',
    ruleName: 'Copyrighted Digital Content',
    ruleText: 'Digital products must not contain copyrighted images, fonts, or content without proper licensing.',
    severity: 'HIGH',
    keywords: [
      'disney clipart', 'marvel clipart', 'licensed character',
      'copyrighted image', 'trademarked design', 'branded template'
    ],
  },
];

async function main() {
  console.log('Seeding database with comprehensive policy rules...');

  // Clear existing data
  console.log('Clearing existing policy rules...');
  await db.delete(violations);
  await db.delete(violationChecks);
  await db.delete(policyRules);

  // Insert policy rules
  console.log('Inserting policy rules...');
  for (const rule of policyRulesData) {
    await db.insert(policyRules).values(rule);
  }

  // Summary by category
  const categories = [...new Set(policyRulesData.map(r => r.category))];
  console.log('\n=== Policy Rules Summary ===');
  for (const cat of categories) {
    const count = policyRulesData.filter(r => r.category === cat).length;
    console.log(`  ${cat}: ${count} rules`);
  }

  // Summary by severity
  const severities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const;
  console.log('\n=== Severity Distribution ===');
  for (const sev of severities) {
    const count = policyRulesData.filter(r => r.severity === sev).length;
    console.log(`  ${sev}: ${count} rules`);
  }

  console.log(`\nTotal: ${policyRulesData.length} policy rules created`);
  console.log('Database seeded successfully!');

  await pool.end();
}

main().catch((e) => {
  console.error('Seeding failed:', e);
  process.exit(1);
});
