# Datacenter Build Wizard

**Open-source knowledge tool for datacenter infrastructure planning.**

Interactive browser-based application that helps people buying, selling, and specifying physical infrastructure equipment into datacenter projects.

## Features

- **Advisor** - Step-by-step decision tree that walks you through your project requirements and provides tailored recommendations with expert tips
- **Knowledge Base** - Searchable FAQ covering power, cooling, racks, cabling, fire protection, and monitoring fundamentals
- **Calculators** - Interactive calculators for Power & PUE, Cooling Load, and Total Cost of Ownership / Build Cost estimation
- **Equipment Compare** - Filter and compare real equipment specs side by side (UPS, PDUs, generators, CRAC/CRAH, chillers, cabinets, cabling, DCIM, fire suppression)
- **Incentives** - Browse rebates, tax credits, grants, and certifications by region (US, Canada, EU)

## Domains

| Domain | Coverage |
|--------|----------|
| **Power** | UPS, PDUs, generators, ATS, busway, switchgear, transformers |
| **Cooling** | CRAC, CRAH, in-row, rear-door, liquid cooling, immersion, chillers, economizers |
| **Racks & Containment** | Server cabinets, hot/cold aisle containment, structured cabling (copper & fiber) |
| **Monitoring & Safety** | DCIM, BMS, environmental sensors, fire suppression, VESDA, EPO |

## Tech Stack

- **Vite** - Build tool and dev server
- **Vanilla JavaScript** - No framework dependencies
- **CSS** - Custom design system with modular stylesheets
- **JSON** - Data-driven architecture for easy content updates

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## Build for Production

```bash
npm run build
npm run preview
```

## Content Architecture

All domain data is stored in `public/data/` as JSON:

- `decision-tree.json` - Advisor questions and recommendation rules
- `faq.json` - Knowledge base entries organized by domain
- `products-power.json` - Power equipment comparison data
- `products-cooling.json` - Cooling equipment comparison data
- `products-racks.json` - Rack and cabling comparison data
- `products-monitoring.json` - Monitoring and safety equipment data
- `incentives.json` - Regional rebates, credits, and certifications

## Curriculum Alignment

Content is informed by the Schneider Electric Data Center Certified Associate (DCCA) curriculum topics:

1. Fundamentals of Availability
2. Power Distribution
3. Cooling Systems
4. Rack & Physical Security
5. Cabling Strategies
6. Fire Protection
7. Efficiency & Sustainability
8. Operations & Monitoring

## License

Open source. Built by [Joshua Strub](https://www.joshuastrub.com).
