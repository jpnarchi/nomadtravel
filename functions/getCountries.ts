import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify user is authenticated
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch countries from REST Countries API
    const response = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2,region,subregion');
    
    if (!response.ok) {
      throw new Error('Failed to fetch countries');
    }

    const data = await response.json();
    
    // Transform and sort countries
    const countries = data
      .map(country => ({
        code: country.cca2,
        name: country.name.common,
        region: country.region || 'Other',
        subregion: country.subregion || ''
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return Response.json({ countries });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});