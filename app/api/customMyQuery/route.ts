import { NextResponse } from 'next/server';

interface Listing {
    media: any; // Specify the type for media if known
    // Add other properties that are part of the listing
    [key: string]: any; // Allow for additional properties
}

export async function POST(req: Request) {
  try {
    const { zip, make, model } = await req.json();
    console.log('Parámetros recibidos:', { zip, make, model });

    const apiKey = 'sTEW9IWh3EPfMu17duNVFCZPnacL2mUz';
    
    const url = `https://mc-api.marketcheck.com/v2/search/car/active?api_key=${apiKey}&zip=${encodeURIComponent(zip)}&radius=50&rows=20&page=1&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`;
    console.log('URL construida:', url);

    const response = await fetch(url);
    console.log('Status de la respuesta:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error al obtener datos:', response.statusText, 'Detalles:', errorText);
      return NextResponse.json({ error: `Error al obtener datos: ${response.statusText}`, details: errorText }, { status: response.status });
    }
    
    let data = await response.json();
    console.log('Datos recibidos:', data);

    // Filtrar los resultados para eliminar los campos "media" y "photo_links_cached"
    if (Array.isArray(data.listings)) {
      data.listings = data.listings.map(({ media, ...rest }: Listing) => rest);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error en customMyQuery:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
