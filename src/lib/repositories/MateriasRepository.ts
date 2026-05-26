import { TablesInsert, TablesUpdate } from '../../types/database.types';
import { supabase } from '../supabase';

export const MateriasRepository = {
  async listMaterias(userId: string) {
    const { data, error } = await supabase
      .from('materias')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getMateria(id: string) {
    const { data, error } = await supabase
      .from('materias')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async createMateria(materia: TablesInsert<'materias'>) {
    const { data, error } = await supabase
      .from('materias')
      .insert(materia)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateMateria(id: string, updates: TablesUpdate<'materias'>) {
    const { data, error } = await supabase
      .from('materias')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteMateria(id: string) {
    const { error } = await supabase.from('materias').delete().eq('id', id);
    if (error) throw error;
  },
};
