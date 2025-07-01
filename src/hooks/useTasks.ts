
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Task {
  id: string;
  title: string;
  description: string | null;
  assigned_to: string | null;
  created_by: string;
  completed: boolean;
  due_date: string | null;
  group_id: string;
  created_at: string;
}

interface CreateTaskData {
  title: string;
  description?: string;
  assigned_to?: string;
  due_date?: string;
  group_id: string;
}

export const useTasks = (groupId: string | null) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchTasks = async () => {
    if (!user || !groupId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tasks:', error);
        toast({
          title: "Erro ao carregar tarefas",
          description: "Não foi possível carregar as tarefas.",
          variant: "destructive",
        });
        return;
      }

      setTasks(data || []);
    } catch (error) {
      console.error('Error in fetchTasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (taskData: CreateTaskData) => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          ...taskData,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating task:', error);
        toast({
          title: "Erro ao criar tarefa",
          description: "Não foi possível criar a tarefa.",
          variant: "destructive",
        });
        return false;
      }

      setTasks(prev => [data, ...prev]);
      toast({
        title: "Tarefa criada",
        description: "A tarefa foi criada com sucesso.",
      });
      return true;
    } catch (error) {
      console.error('Error in createTask:', error);
      return false;
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .select()
        .single();

      if (error) {
        console.error('Error updating task:', error);
        toast({
          title: "Erro ao atualizar tarefa",
          description: "Não foi possível atualizar a tarefa.",
          variant: "destructive",
        });
        return false;
      }

      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, ...data } : task
      ));
      return true;
    } catch (error) {
      console.error('Error in updateTask:', error);
      return false;
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) {
        console.error('Error deleting task:', error);
        toast({
          title: "Erro ao excluir tarefa",
          description: "Não foi possível excluir a tarefa.",
          variant: "destructive",
        });
        return false;
      }

      setTasks(prev => prev.filter(task => task.id !== taskId));
      toast({
        title: "Tarefa excluída",
        description: "A tarefa foi excluída com sucesso.",
      });
      return true;
    } catch (error) {
      console.error('Error in deleteTask:', error);
      return false;
    }
  };

  const toggleTaskCompletion = async (taskId: string, completed: boolean) => {
    return updateTask(taskId, { completed });
  };

  useEffect(() => {
    fetchTasks();
  }, [user, groupId]);

  return {
    tasks,
    loading,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskCompletion,
    fetchTasks,
  };
};
