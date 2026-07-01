import { supabase } from './supabase'
import type { EasProblem, EasSolutionStep } from '../types/database'

export async function getProblems(): Promise<EasProblem[]> {
  const { data, error } = await supabase
    .from('o2_eas_problems')
    .select('*')
    .order('source')
    .order('chapter')
    .order('problem_number')
  if (error) throw error
  return data
}

export async function getProblemWithSteps(
  id: string
): Promise<{ problem: EasProblem; steps: EasSolutionStep[] }> {
  const [{ data: problem, error: pe }, { data: steps, error: se }] = await Promise.all([
    supabase.from('o2_eas_problems').select('*').eq('id', id).single(),
    supabase
      .from('o2_eas_solution_steps')
      .select('*')
      .eq('problem_id', id)
      .order('step_order'),
  ])
  if (pe) throw pe
  if (se) throw se
  return { problem: problem!, steps: steps ?? [] }
}

export async function getProblemsByStatus(
  status: 'solved' | 'unsolved'
): Promise<EasProblem[]> {
  const { data, error } = await supabase
    .from('o2_eas_problems')
    .select('*')
    .eq('solution_status', status)
    .order('source')
    .order('problem_number')
  if (error) throw error
  return data
}

export async function getProblemsByDecompositionType(
  type: 'specific' | 'framework'
): Promise<EasProblem[]> {
  const { data, error } = await supabase
    .from('o2_eas_problems')
    .select('*')
    .eq('decomposition_type', type)
    .order('source')
    .order('problem_number')
  if (error) throw error
  return data
}
