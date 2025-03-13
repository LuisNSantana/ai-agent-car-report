declare module "google-ads-api" {
    interface ClientOptions {
      client_id?: string;
      client_secret?: string;
      developer_token: string;
      refresh_token?: string; // Añadimos refresh_token como opcional
    }
  
    class GoogleAdsApi {
      constructor(options: ClientOptions);
      Customer(options: { customer_id: string; refresh_token?: string }): {
        query(query: string): Promise<any[]>;
      };
    }
  }