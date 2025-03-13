import puppeteer from "puppeteer";

interface DealerInfo {
  name: string;
  city: string;
  state: string;
  website?: string;
  phone?: string;
}

interface BuildInfo {
  make: string;
  model: string;
  year: number;
  trim?: string;
  transmission?: string;
  fuel_type?: string;
  mileage?: number;
  engine?: string;
  body_type?: string;
  doors?: number;
  drivetrain?: string;
}

interface Car {
  id?: string;
  price: number;
  miles: number;
  msrp?: number;
  build: BuildInfo;
  exterior_color?: string;
  interior_color?: string;
  dealer?: DealerInfo;
  vdp_url?: string;
  dom?: number;
  // Se pueden agregar más propiedades según la información extra (como VIN, carfax, etc.)
  vin?: string;
  heading?: string;
  carfax_1_owner?: boolean;
  carfax_clean_title?: boolean;
}

interface CarReportData {
  num_found: number;
  listings: Car[];
}

function getCarStats(cars: Car[]) {
  if (cars.length === 0) {
    return { avgPrice: 0, minPrice: 0, maxPrice: 0, avgDiscount: 0, bestAcquisition: "0.00" };
  }
  const prices = cars.map((c) => c.price).filter(price => price > 0);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;
  const avgPrice = prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;

  const discountPercents: number[] = [];
  cars.forEach((car) => {
    if (car.msrp && car.msrp > 0 && car.msrp > car.price) {
      const discount = ((car.msrp - car.price) / car.msrp) * 100;
      discountPercents.push(discount);
    }
  });
  const avgDiscount = discountPercents.length ? Math.round(discountPercents.reduce((a, b) => a + b, 0) / discountPercents.length) : 0;

  const pricePerMile = cars
    .filter(car => car.miles > 0)
    .map(car => car.price / car.miles);
  const bestAcquisition = pricePerMile.length ? Math.min(...pricePerMile).toFixed(2) : "0.00";

  return { avgPrice, minPrice, maxPrice, avgDiscount, bestAcquisition };
}

export async function generateCarReportPDF(data: CarReportData): Promise<Buffer> {
  try {
    console.log("📌 Iniciando Puppeteer...");
    const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
    const page = await browser.newPage();

    console.log("📌 Generando HTML para el PDF...");

    const { avgPrice, minPrice, maxPrice, avgDiscount, bestAcquisition } = getCarStats(data.listings);
    
    // Preparando datos para gráficos
    const labels = data.listings.map(car => `${car.build.year} ${car.build.model}`);
    const prices = data.listings.map(car => car.price);
    const pricePerMile = data.listings.map(car => car.miles > 0 ? +(car.price / car.miles).toFixed(2) : 0);
    const discounts = data.listings.map(car => {
      if (car.msrp && car.msrp > car.price) {
        return +(((car.msrp - car.price) / car.msrp * 100).toFixed(2));
      }
      return 0;
    });
    const miles = data.listings.map(car => car.miles);

    const htmlContent = `
      <html>
        <head>
          <meta charset="utf-8">
          <title>Informe Premium de Autos</title>
          <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
          <style>
            body { font-family: Helvetica, Arial, sans-serif; margin: 30px; color: #444; background-color: #f9f9f9; }
            h1, h2, h3 { text-align: center; color: #222; }
            .stats { text-align: center; font-size: 1.2em; color: #333; margin: 20px 0; }
            .chart-container { width: 80%; margin: 30px auto; }
            table { width: 100%; border-collapse: collapse; background-color: #fff; font-size: 13px; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background-color: #eaeaea; font-weight: bold; }
            tr:nth-child(even) { background-color: #f6f6f6; }
            a { color: #007bff; text-decoration: none; font-size: 13px; }
            a:hover { text-decoration: underline; }
          </style>
        </head>
        <body>
          <h1>Informe Premium de Autos</h1>
          <h2>Total de listados: ${data.num_found}</h2>
          <div class="stats">
            <p><strong>Precio Mínimo:</strong> $${minPrice}</p>
            <p><strong>Precio Máximo:</strong> $${maxPrice}</p>
            <p><strong>Precio Promedio:</strong> $${avgPrice}</p>
            <p><strong>Mejor Adquisición (USD/milla):</strong> $${bestAcquisition}</p>
            <p><strong>Descuento Promedio:</strong> ${avgDiscount}%</p>
          </div>
          <div class="chart-container">
            <canvas id="priceChart"></canvas>
          </div>
          <div class="chart-container">
            <canvas id="ppmChart"></canvas>
          </div>
          <div class="chart-container">
            <canvas id="discountChart"></canvas>
          </div>
          <div class="chart-container">
            <canvas id="milesChart"></canvas>
          </div>
          <h2>Listado Detallado</h2>
          <table>
            <thead>
              <tr>
                <th>Marca</th>
                <th>Modelo</th>
                <th>Año</th>
                <th>Transmisión</th>
                <th>Combustible</th>
                <th>Color Exterior</th>
                <th>Precio</th>
                <th>Millas</th>
                <th>Dealer</th>
                <th>Ver Detalles</th>
              </tr>
            </thead>
            <tbody>
              ${data.listings.map(car => `
                <tr>
                  <td>${car.build.make}</td>
                  <td>${car.build.model}</td>
                  <td>${car.build.year}</td>
                  <td>${car.build.transmission || "N/A"}</td>
                  <td>${car.build.fuel_type || "N/A"}</td>
                  <td>${car.exterior_color || "N/A"}</td>
                  <td>$${car.price}</td>
                  <td>${car.miles} millas</td>
                  <td>${car.dealer ? `${car.dealer.name}, ${car.dealer.city}, ${car.dealer.state}` : "N/A"}</td>
                  <td>${car.vdp_url ? `<a href="${car.vdp_url}" target="_blank">Ver</a>` : "N/A"}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <script>
            // ¡A darle vida a los gráficos!
            const labels = ${JSON.stringify(labels)};
            const prices = ${JSON.stringify(prices)};
            const ppmData = ${JSON.stringify(pricePerMile)};
            const discountData = ${JSON.stringify(discounts)};
            const milesData = ${JSON.stringify(miles)};

            // Gráfico de Precios (Barras)
            const ctxPrice = document.getElementById('priceChart').getContext('2d');
            new Chart(ctxPrice, {
              type: 'bar',
              data: {
                labels: labels,
                datasets: [{
                  label: 'Precio ($)',
                  data: prices,
                  backgroundColor: 'rgba(75, 192, 192, 0.6)',
                  borderColor: 'rgba(75, 192, 192, 1)',
                  borderWidth: 1
                }]
              },
              options: {
                responsive: true,
                plugins: {
                  title: {
                    display: true,
                    text: 'Distribución de Precios'
                  }
                }
              }
            });

            // Gráfico de Precio por Milla (Línea)
            const ctxPpm = document.getElementById('ppmChart').getContext('2d');
            new Chart(ctxPpm, {
              type: 'line',
              data: {
                labels: labels,
                datasets: [{
                  label: 'Precio por Milla ($)',
                  data: ppmData,
                  backgroundColor: 'rgba(153, 102, 255, 0.4)',
                  borderColor: 'rgba(153, 102, 255, 1)',
                  fill: true,
                  tension: 0.2
                }]
              },
              options: {
                responsive: true,
                plugins: {
                  title: {
                    display: true,
                    text: 'Precio por Milla'
                  }
                }
              }
            });

            // Gráfico de Descuentos (Dona)
            const ctxDiscount = document.getElementById('discountChart').getContext('2d');
            new Chart(ctxDiscount, {
              type: 'doughnut',
              data: {
                labels: labels,
                datasets: [{
                  label: 'Descuento (%)',
                  data: discountData,
                  backgroundColor: labels.map(() => 'rgba(255, 159, 64, 0.6)'),
                  borderColor: labels.map(() => 'rgba(255, 159, 64, 1)'),
                  borderWidth: 1
                }]
              },
              options: {
                responsive: true,
                plugins: {
                  title: {
                    display: true,
                    text: 'Porcentaje de Descuento por Auto'
                  }
                }
              }
            });

            // Gráfico de Millas (Barras horizontales)
            const ctxMiles = document.getElementById('milesChart').getContext('2d');
            new Chart(ctxMiles, {
              type: 'bar',
              data: {
                labels: labels,
                datasets: [{
                  label: 'Millas Recorridas',
                  data: milesData,
                  backgroundColor: 'rgba(255, 99, 132, 0.6)',
                  borderColor: 'rgba(255, 99, 132, 1)',
                  borderWidth: 1
                }]
              },
              options: {
                indexAxis: 'y',
                responsive: true,
                plugins: {
                  title: {
                    display: true,
                    text: 'Millas Recorridas por Auto'
                  }
                }
              }
            });
          </script>
        </body>
      </html>
    `;

    await page.setContent(htmlContent, { waitUntil: "networkidle0" });
    // Un pequeño descanso para que los gráficos se rendericen bien... ¡como un café antes de la acción!
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log("📌 Generando PDF...");
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20mm", right: "20mm", bottom: "20mm", left: "20mm" }
    });
    await browser.close();
    console.log("✅ PDF generado con éxito");
    return Buffer.from(pdfBuffer);
  } catch (error) {
    console.error("❌ Error generando PDF:", error);
    throw new Error("Error generando PDF con Puppeteer");
  }
}
