/**
 * Mock data para desarrollo sin magnumsmaster
 */

export const mockWineries = {
  success: true,
  data: [
    {
      id: 1,
      nombre: "Traslascuestas",
      email: "info@traslascuestas.com",
      role: "winery",
      kyc_status: "approved",
      subscription_status: "active",
      badges: ["do_rueda", "uva_verdejo", "uva_sauvignon_blanc", "estilo_espumoso", "estilo_blanco"],
      denominaciones: [
        {
          id: 1,
          nombre: "Rueda",
          tipo: "DO",
          variedades: ["Verdejo", "Sauvignon Blanc"],
          tipos_vino: ["Espumoso", "Blanco"]
        }
      ]
    },
    {
      id: 2,
      nombre: "Cal Batllet",
      email: "contact@calbatllet.com",
      role: "winery",
      kyc_status: "approved",
      subscription_status: "active",
      badges: ["do_priorat", "uva_garnacha", "uva_carinena", "uva_cabernet", "uva_syrah", "estilo_blanco", "estilo_reserva", "estilo_crianza"],
      denominaciones: [
        {
          id: 2,
          nombre: "Priorat",
          tipo: "DOQ",
          variedades: ["Garnacha", "Cariñena", "Cabernet Sauvignon", "Syrah"],
          tipos_vino: ["Blanco", "Reserva", "Crianza"]
        }
      ]
    },
    {
      id: 3,
      nombre: "FyA",
      email: "info@fya-wines.com",
      role: "winery",
      kyc_status: "approved",
      subscription_status: "trial",
      badges: ["do_rioja", "uva_tempranillo", "uva_garnacha", "estilo_gran_reserva", "estilo_reserva", "estilo_crianza"],
      denominaciones: [
        {
          id: 3,
          nombre: "Rioja",
          tipo: "DOCa",
          variedades: ["Tempranillo", "Garnacha"],
          tipos_vino: ["Gran Reserva", "Reserva", "Crianza"]
        }
      ]
    },
    {
      id: 4,
      nombre: "Fernández de Piérola",
      email: "bodega@fernandezdepierola.com",
      role: "winery",
      kyc_status: "approved",
      subscription_status: "active",
      badges: ["do_rioja", "uva_tempranillo", "uva_garnacha", "estilo_gran_reserva", "estilo_reserva"],
      denominaciones: [
        {
          id: 3,
          nombre: "Rioja",
          tipo: "DOCa",
          variedades: ["Tempranillo", "Garnacha"],
          tipos_vino: ["Gran Reserva", "Reserva"]
        }
      ]
    }
  ],
  pagination: {
    total: 4,
    page: 1,
    limit: 20,
    totalPages: 1
  },
  source: 'mock',
  timestamp: new Date().toISOString()
};
