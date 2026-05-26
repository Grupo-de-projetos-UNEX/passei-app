import { TablesUpdate } from '../../types/database.types';
import { supabase } from '../supabase';

export const AtividadesRepository = {
  async listAtividades(materiaId: string) {
    const { data, error } = await supabase
      .from('atividades')
      .select('*')
      .eq('materia_id', materiaId)
      .order('ordem', { ascending: true });
    if (error) throw error;
    return data;
  },

  async getAtividade(id: string) {
    const { data, error } = await supabase
      .from('atividades')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async updateAtividade(id: string, updates: TablesUpdate<'atividades'>) {
    const { data, error } = await supabase
      .from('atividades')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Convenience: registra a nota de uma atividade (null = remover nota / voltar a pendente)
  async lancarNota(id: string, pontosObtidos: number | null) {
    return AtividadesRepository.updateAtividade(id, {
      pontos_obtidos: pontosObtidos,
    });
  },
};
