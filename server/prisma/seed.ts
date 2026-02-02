import { PrismaClient, Severity } from '@prisma/client';

const prisma = new PrismaClient();

const policyRules = [
  // Prohibited Items
  {
    category: 'prohibited_items',
    ruleName: 'Weapons and Dangerous Items',
    ruleText: 'Etsy prohibits the sale of weapons, including firearms, ammunition, and weapons that are designed to cause harm.',
    severity: Severity.CRITICAL,
    keywords: ['gun', 'firearm', 'ammunition', 'ammo', 'weapon', 'knife', 'switchblade', 'brass knuckles'],
  },
  {
    category: 'prohibited_items',
    ruleName: 'Drugs and Drug Paraphernalia',
    ruleText: 'Items that promote or facilitate illegal drug use are prohibited on Etsy.',
    severity: Severity.CRITICAL,
    keywords: ['drug', 'cannabis', 'marijuana', 'weed', 'thc', 'cbd oil', 'bong', 'pipe for smoking'],
  },
  {
    category: 'prohibited_items',
    ruleName: 'Tobacco and Vaping Products',
    ruleText: 'Tobacco, cigarettes, and vaping products containing nicotine are not allowed.',
    severity: Severity.HIGH,
    keywords: ['cigarette', 'tobacco', 'vape', 'e-cigarette', 'nicotine', 'juul'],
  },
  {
    category: 'prohibited_items',
    ruleName: 'Live Animals',
    ruleText: 'Live animals cannot be sold on Etsy.',
    severity: Severity.HIGH,
    keywords: ['live animal', 'live pet', 'live fish', 'live insect', 'live reptile'],
  },

  // Intellectual Property
  {
    category: 'intellectual_property',
    ruleName: 'Trademarked Brand Names',
    ruleText: 'Using trademarked brand names without authorization is prohibited. This includes popular brands in titles, tags, or descriptions.',
    severity: Severity.HIGH,
    keywords: ['disney', 'nike', 'adidas', 'louis vuitton', 'gucci', 'chanel', 'supreme', 'marvel', 'harry potter', 'star wars', 'pokemon', 'nintendo'],
  },
  {
    category: 'intellectual_property',
    ruleName: 'Sports Team Logos',
    ruleText: 'Unauthorized use of professional sports team logos, names, or imagery is prohibited.',
    severity: Severity.HIGH,
    keywords: ['nfl', 'nba', 'mlb', 'nhl', 'fifa', 'official team', 'licensed'],
  },
  {
    category: 'intellectual_property',
    ruleName: 'Celebrity Images',
    ruleText: 'Using celebrity images or likenesses without permission may violate publicity rights.',
    severity: Severity.MEDIUM,
    keywords: ['celebrity', 'famous person', 'movie star', 'singer photo'],
  },

  // Listing Requirements
  {
    category: 'listing_requirements',
    ruleName: 'Accurate Item Description',
    ruleText: 'Listings must accurately describe the item being sold. Misleading descriptions are not allowed.',
    severity: Severity.MEDIUM,
    keywords: ['not as described', 'replica', 'fake', 'imitation', 'knockoff', 'inspired by'],
  },
  {
    category: 'listing_requirements',
    ruleName: 'Handmade Claims',
    ruleText: 'If an item is listed as handmade, it must be made or designed by you. Reselling mass-produced items as handmade is prohibited.',
    severity: Severity.HIGH,
    keywords: ['dropship', 'alibaba', 'aliexpress', 'wholesale', 'mass produced', 'factory made'],
  },
  {
    category: 'listing_requirements',
    ruleName: 'Proper Categorization',
    ruleText: 'Items must be listed in the appropriate category. Miscategorization to gain visibility is not allowed.',
    severity: Severity.LOW,
    keywords: [],
  },

  // Safety and Regulated Items
  {
    category: 'safety',
    ruleName: 'Food Safety Requirements',
    ruleText: 'Food items must comply with all applicable food safety regulations and include proper ingredient lists and allergen warnings.',
    severity: Severity.HIGH,
    keywords: ['contains nuts', 'allergen', 'food product', 'edible', 'consumable'],
  },
  {
    category: 'safety',
    ruleName: 'Cosmetics and Skincare',
    ruleText: 'Cosmetics and skincare products must include ingredient lists and comply with FDA regulations.',
    severity: Severity.MEDIUM,
    keywords: ['skincare', 'cosmetic', 'lotion', 'cream', 'serum', 'face mask', 'lip balm'],
  },
  {
    category: 'safety',
    ruleName: 'Children Product Safety',
    ruleText: 'Products intended for children must meet safety standards and should not contain small parts that pose choking hazards.',
    severity: Severity.CRITICAL,
    keywords: ['for kids', 'children', 'baby', 'infant', 'toddler', 'nursery'],
  },

  // Prohibited Services
  {
    category: 'prohibited_services',
    ruleName: 'Services Not Allowed',
    ruleText: 'Etsy is for selling physical and digital products, not services. Service-only listings are not permitted.',
    severity: Severity.MEDIUM,
    keywords: ['consultation', 'coaching', 'lesson', 'service only', 'hourly rate'],
  },
];

async function main() {
  console.log('Seeding database...');

  // Clear existing policy rules
  await prisma.violation.deleteMany();
  await prisma.violationCheck.deleteMany();
  await prisma.policyRule.deleteMany();

  // Insert policy rules
  for (const rule of policyRules) {
    await prisma.policyRule.create({
      data: rule,
    });
  }

  console.log(`Created ${policyRules.length} policy rules`);
  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
