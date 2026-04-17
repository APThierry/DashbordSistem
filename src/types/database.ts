// src/types/database.ts

// ============================================
// TIPOS DAS TABELAS DO SUPABASE
// ============================================

// Dimensão: Lojas
export interface DimLoja {
  loja_sk: number
  loja_id: string
  codigo_loja: string
  nome_loja: string
  segmento: string | null
  classificacao: string | null
  tipo: string | null
  status: string | null
  abl_m2: number | null
  valid_from: string | null
  valid_to: string | null
  is_current: boolean
  run_id: string | null
  created_at: string
  updated_at: string | null
}

// Dimensão: Tempo
export interface DimTempo {
  data_id: number
  data_completa: string
  ano: number
  mes: number
  dia: number
  trimestre: number
  semestre: number
  dia_semana: number
  nome_mes: string
  nome_dia_semana: string
}

// Fato: Vendas
export interface FactVendas {
  id: number
  data_id: number
  loja_sk: number
  valor_faturamento: number
  quantidade_vendas: number
  ticket_medio: number
  run_id: string | null
  created_at: string
}

// Fato: Ocupação
export interface FactOcupacao {
  id: number
  ano: number
  mes: number
  abl_total_m2: number
  abl_ocupado_m2: number
  lojas_ativas: number
  lojas_inativas: number
  run_id: string | null
  created_at: string
}

// ============================================
// TIPOS PARA O DASHBOARD (Agregados)
// ============================================

export interface ResumoMensal {
  competencia: string
  vendas_total: number
  ticket_medio: number
  qtd_vendas: number
}

export interface OcupacaoResumo {
  ano: number
  mes: number
  abl_total: number
  abl_ocupado: number
  vacancia: number
  taxa_ocupacao: number
  lojas_ativas: number
  lojas_inativas: number
}

export interface LojaResumo {
  loja_sk: number
  nome: string
  segmento: string | null
  classificacao: string | null
  tipo: string | null
  status: string | null
  abl_m2: number | null
}

// ============================================
// TIPOS DO SUPABASE (Gerado)
// ============================================

export type Database = {
  public: {
    Tables: {
      dim_loja: {
        Row: DimLoja
        Insert: Partial<DimLoja>
        Update: Partial<DimLoja>
      }
      fact_vendas: {
        Row: FactVendas
        Insert: Partial<FactVendas>
        Update: Partial<FactVendas>
      }
      fact_ocupacao: {
        Row: FactOcupacao
        Insert: Partial<FactOcupacao>
        Update: Partial<FactOcupacao>
      }
    }
    Views: {
      vw_vendas_yoy: {
        Row: {
          competencia: string
          ano_atual: number
          ano_anterior: number
          variacao_pct: number
        }
      }
    }
  }
}