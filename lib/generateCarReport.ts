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

interface MediaInfo {
  photo_links?: string[];
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
  media?: MediaInfo;
  dom?: number;
}

interface CarReportData {
  num_found: number;
  listings: Car[];
}

/**
 * Calcula estadísticas básicas y adicionales para el resumen.
 */
function getCarStats(cars: Car[]) {
  if (cars.length === 0) {
    return { avgPrice: 0, minPrice: 0, maxPrice: 0, avgDiscount: 0, bestAcquisition: 0 };
  }
  const prices = cars.map((c) => c.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);

  // Descuento promedio (si msrp disponible)
  const discountPercents: number[] = [];
  cars.forEach((car) => {
    if (car.msrp && car.msrp > 0 && car.msrp > car.price) {
      const discount = ((car.msrp - car.price) / car.msrp) * 100;
      discountPercents.push(discount);
    }
  });
  const avgDiscount =
    discountPercents.length > 0
      ? Math.round(discountPercents.reduce((a, b) => a + b, 0) / discountPercents.length)
      : 0;

  // Mejor adquisición: menor precio por milla
  const pricePerMile = cars
    .filter(car => car.miles > 0)
    .map(car => car.price / car.miles);
  const bestAcquisition = pricePerMile.length > 0 ? Math.min(...pricePerMile) : 0;

  return { avgPrice, minPrice, maxPrice, avgDiscount, bestAcquisition };
}

export async function generateCarReportPDF(data: CarReportData): Promise<Buffer> {
  try {
    console.log("📌 Iniciando Puppeteer...");
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();

    console.log("📌 Generando HTML para el PDF...");

    // Estadísticas generales
    const { avgPrice, minPrice, maxPrice, avgDiscount, bestAcquisition } = getCarStats(data.listings);
    const priceData = data.listings.map(car => car.price);
    const ppmData = data.listings.map(car => car.miles > 0 ? +(car.price / car.miles).toFixed(2) : 0);
    // Etiquetas más intuitivas: "AÑO MODELO"
    const labels = data.listings.map(car => `${car.build.year} ${car.build.model}`);

    const htmlContent = `
      <html>
        <head>
          <meta charset="utf-8">
          <title>Informe Premium de Mercado de Autos</title>
          <style>
            body {
              font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
              margin: 30px;
              color: #444;
              background-color: #f9f9f9;
              font-size: 14px; /* un poco más pequeño para que quepa mejor */
            }
            h1, h2, h3 {
              text-align: center;
              color: #222;
              margin-bottom: 0.5em;
            }
            .stats {
              text-align: center;
              margin: 20px 0;
              font-size: 1.2em;
              color: #333;
            }
            .charts-section {
              margin: 30px 0;
              padding: 20px;
              background: #fff;
              border: 1px solid #ddd;
              border-radius: 8px;
            }
            .chart-container {
              width: 95%;
              margin: 0 auto 30px;
            }
            .chart-info {
              text-align: center;
              font-size: 1em;
              color: #666;
            }
            .table-container {
              margin-top: 20px;
              overflow-x: auto;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              background-color: #fff;
              font-size: 13px; /* un poco más reducido */
              white-space: nowrap; /* para que no parta texto */
            }
            th, td {
              border: 1px solid #ddd;
              padding: 10px;
              text-align: left;
              vertical-align: middle;
            }
            th {
              background-color: #eaeaea;
              font-weight: bold;
            }
            tr:nth-child(even) {
              background-color: #f6f6f6;
            }
            a {
              color: #007bff;
              text-decoration: none;
              font-size: 13px;
            }
            a:hover {
              text-decoration: underline;
            }
            .car-image {
              width: 120px; /* más pequeña para que entre mejor */
              height: auto;
              display: block;
              margin: 0 auto;
              border-radius: 4px;
            }
            .footer {
              text-align: center;
              font-size: 0.9em;
              color: #777;
              margin-top: 30px;
              border-top: 1px solid #ddd;
              padding-top: 10px;
            }
          </style>
        </head>
        <body>
          <h1>Informe Premium de Mercado de Autos</h1>
          <h2>Total de listados encontrados: ${data.num_found}</h2>
          
          <div class="stats">
            <p><strong>Precio Mínimo:</strong> $${minPrice}</p>
            <p><strong>Precio Máximo:</strong> $${maxPrice}</p>
            <p><strong>Precio Promedio:</strong> $${avgPrice}</p>
            <p><strong>Mejor Adquisición (USD/milla):</strong> $${bestAcquisition.toFixed(2)}</p>
            <p><strong>Descuento Promedio:</strong> ${avgDiscount}%</p>
          </div>
          
          <div class="charts-section">
            <h2>Sección de Gráficas</h2>
            <div class="chart-container">
              <canvas id="priceChart"></canvas>
              <p class="chart-info">Distribución de Precios (USD)</p>
            </div>
            <div class="chart-container">
              <canvas id="ppmChart"></canvas>
              <p class="chart-info">Precio por Milla (USD/milla)</p>
            </div>
          </div>
          
          <h2>Listado Detallado</h2>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Imagen</th>
                  <th>Marca</th>
                  <th>Modelo</th>
                  <th>Año</th>
                  <th>Trim</th>
                  <th>Transmisión</th>
                  <th>Combustible</th>
                  <th>Color Ext.</th>
                  <th>Precio</th>
                  <th>Millaje</th>
                  <th>Dealer</th>
                  <th>Ver Detalles</th>
                </tr>
              </thead>
              <tbody>
                ${
                  data.listings.map((car: Car) => {
                    const imageUrl = car.media?.photo_links?.[0] || "";
                    return `
                      <tr>
                        <td>${
                          imageUrl
                            ? `<img src="${imageUrl}" alt="Imagen ${car.build.make} ${car.build.model}" class="car-image" />`
                            : "N/A"
                        }</td>
                        <td>${car.build.make || "N/A"}</td>
                        <td>${car.build.model || "N/A"}</td>
                        <td>${car.build.year || "N/A"}</td>
                        <td>${car.build.trim || "N/A"}</td>
                        <td>${car.build.transmission || "N/A"}</td>
                        <td>${car.build.fuel_type || "N/A"}</td>
                        <td>${car.exterior_color || "N/A"}</td>
                        <td>$${car.price}</td>
                        <td>${car.miles} millas</td>
                        <td>${
                          car.dealer
                            ? `${car.dealer.name}<br>${car.dealer.city}, ${car.dealer.state}<br>${car.dealer.phone ? "Tel: " + car.dealer.phone : ""}`
                            : "N/A"
                        }</td>
                        <td>${
                          car.vdp_url
                            ? `<a href="${car.vdp_url}" target="_blank">Ver VDP</a>`
                            : "N/A"
                        }</td>
                      </tr>
                    `;
                  }).join("")
                }
              </tbody>
            </table>
          </div>
          
          <div class="footer">
            <p>Generado automáticamente con Puppeteer, Chart.js y HTML5.</p>
          </div>
          
          <!-- Scripts de Chart.js -->
          <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
          <script>
            (function() {
              const priceData = ${JSON.stringify(priceData)};
              const ppmData = ${JSON.stringify(ppmData)};
              const labels = ${JSON.stringify(labels)};
              
              // Gráfico de distribución de precios
              const ctxPrice = document.getElementById('priceChart').getContext('2d');
              new Chart(ctxPrice, {
                type: 'bar',
                data: {
                  labels: labels,
                  datasets: [{
                    label: 'Precio (USD)',
                    data: priceData,
                    backgroundColor: 'rgba(0, 123, 255, 0.5)',
                    borderColor: 'rgba(0, 123, 255, 1)',
                    borderWidth: 1
                  }]
                },
                options: {
                  responsive: true,
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'Precio en USD'
                      }
                    },
                    x: {
                      title: {
                        display: true,
                        text: 'Coche (Año Modelo)'
                      }
                    }
                  },
                  plugins: {
                    title: {
                      display: true,
                      text: 'Distribución de Precios'
                    }
                  }
                }
              });

              // Gráfico de precio por milla
              const ctxPPM = document.getElementById('ppmChart').getContext('2d');
              new Chart(ctxPPM, {
                type: 'line',
                data: {
                  labels: labels,
                  datasets: [{
                    label: 'Precio por Milla (USD/milla)',
                    data: ppmData,
                    backgroundColor: 'rgba(40, 167, 69, 0.5)',
                    borderColor: 'rgba(40, 167, 69, 1)',
                    borderWidth: 2,
                    fill: true
                  }]
                },
                options: {
                  responsive: true,
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'USD por milla'
                      }
                    },
                    x: {
                      title: {
                        display: true,
                        text: 'Coche (Año Modelo)'
                      }
                    }
                  },
                  plugins: {
                    title: {
                      display: true,
                      text: 'Precio por Milla'
                    }
                  }
                }
              });
            })();
          </script>
        </body>
      </html>
    `;

    // Ajustamos la página a A3 en modo landscape para más espacio
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log("📌 Generando PDF...");
    const pdfBuffer = await page.pdf({
      format: "A3",         // Más grande que A4
      landscape: true,      // Para mayor ancho
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
