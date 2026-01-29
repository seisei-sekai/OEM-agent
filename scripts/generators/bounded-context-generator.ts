export function generateBoundedContextMap(): string {
  return `graph TB
    subgraph BC1["OEM Agent Context - Core Bounded Context"]
        direction TB
        subgraph ConvMgmt["Conversation Management Subdomain"]
            ChatSession["ChatSession Aggregate"]
            Message["Message Entity"]
        end
        
        subgraph ProdCat["Product Catalog Subdomain"]
            Product["Product Aggregate"]
            ProductCat["ProductCategory"]
        end
        
        subgraph BrandExt["Branding Extraction Subdomain"]
            Branding["BrandingInfo Aggregate"]
            Logo["LogoImage VO"]
        end
        
        subgraph CostCalc["Cost Calculation Subdomain"]
            Calculator["CostCalculator Service"]
            Price["Price VO"]
        end
    end
    
    subgraph External["External Systems"]
        OpenAI["OpenAI API<br/>Vision & LLM"]
        Weaviate["Weaviate<br/>Vector Search"]
        MongoDB["MongoDB<br/>Persistence"]
    end
    
    ConvMgmt -->|uses| BrandExt
    ConvMgmt -->|queries| ProdCat
    ProdCat -->|uses| CostCalc
    
    BrandExt -.->|calls| OpenAI
    ProdCat -.->|searches| Weaviate
    ConvMgmt -.->|persists to| MongoDB
    ProdCat -.->|persists to| MongoDB
    
    style BC1 fill:#e8f4f8
    style External fill:#f0f0f0
    style ConvMgmt fill:#ffcccc
    style ProdCat fill:#ccffcc
    style BrandExt fill:#ccccff
    style CostCalc fill:#ffffcc
`;
}
