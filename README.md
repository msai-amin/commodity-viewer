# Bank of Canada Commodity Price Index Viewer

A modern web application for visualizing the Bank of Canada's Commodity Price Index data. This interactive dashboard allows users to explore historical commodity price trends and year-over-year changes across different sectors.

## Features

- Interactive line chart visualization
- Year-over-Year (YoY) change analysis
- Multiple commodity indices:
  - Total Index
  - Energy
  - Metals & Minerals
  - Agriculture
  - Forestry
  - Fish
- Date range filtering
- Latest values and trends display
- Responsive design

## Technologies Used

- Next.js 15.2.0
- React
- TypeScript
- Recharts
- Tailwind CSS

## Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/commodity-viewer.git
cd commodity-viewer
```

2. Install dependencies:
```bash
npm install
```

3. Place the data file:
- Download the BCPI_WEEKLY-sd-1972-01-01.json file
- Place it in the `public` directory

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
commodity-viewer/
├── public/
│   └── BCPI_WEEKLY-sd-1972-01-01.json
├── src/
│   └── app/
│       ├── page.tsx        # Main application component
│       ├── layout.tsx      # Root layout
│       └── globals.css     # Global styles
├── package.json
└── tsconfig.json
```

## License

MIT

## Acknowledgments

- Data provided by the Bank of Canada
- Built with Next.js and Recharts
