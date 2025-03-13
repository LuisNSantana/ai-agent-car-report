import { NextResponse } from 'next/server';

interface Listing {
  media: any;
  make: string;
  model?: string;
  trim?: string;
  year?: string;
  heading: string;
  [key: string]: any;
}

export async function POST(req: Request) {
  try {
    const { zip, make, model, trim, year } = await req.json();
    console.log('Parámetros recibidos:', { zip, make, model, trim, year });

    if (!make) {
      console.error('Falta el parámetro requerido: make');
      return NextResponse.json(
        { error: 'Make es requerido' },
        { status: 400 }
      );
    }

    const apiKey = process.env.MARKETCHECK_API_KEY;
    if (!apiKey) {
      console.error('API Key no configurada');
      return NextResponse.json(
        { error: 'Configuración del servidor incompleta' },
        { status: 500 }
      );
    }

    let url = `https://mc-api.marketcheck.com/v2/search/car/active?api_key=${apiKey}&rows=100`;
    if (zip) url += `&zip=${encodeURIComponent(zip)}&radius=50`;
    if (make) url += `&make=${encodeURIComponent(make)}`;
    if (model) url += `&model=${encodeURIComponent(model)}`;
    if (year) url += `&year=${encodeURIComponent(year)}`;
    console.log('URL construida:', url);

    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    console.log('Status de la respuesta:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error al obtener datos:', response.status, errorText);
      if (response.status === 429) {
        return NextResponse.json(
          { error: 'Límite de solicitudes excedido, intenta de nuevo más tarde' },
          { status: 429 }
        );
      }
      if (response.status === 400) {
        return NextResponse.json(
          { error: 'Solicitud inválida, revisa los parámetros' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: `Error al obtener datos: ${response.statusText}`, details: errorText },
        { status: response.status }
      );
    }

    let data = await response.json();
    console.log('Datos recibidos (antes de filtro):', { num_found: data.num_found, listings: data.listings.length });

    if (Array.isArray(data.listings)) {
      // Filtrar "Big Horn" en el heading si se especificó trim
      let filteredListings = data.listings;
      if (trim && trim.toLowerCase() === "big horn") {
        filteredListings = data.listings.filter((listing: Listing) =>
          listing.heading.toLowerCase().includes("big horn")
        );
        data.num_found = filteredListings.length; // Actualizar el conteo
        console.log('Datos filtrados (Big Horn):', { num_found: data.num_found, listings: filteredListings.length });
      }

      // Eliminar el campo media de todos los listings
      data.listings = filteredListings.map(({ media, ...rest }: Listing) => rest);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error en customMyQuery:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}