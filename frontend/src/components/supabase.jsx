import supabase from './service/supabaseClient'

async function fetchData() {
  const { data, error } = await supabase.from('your_table').select('*')
  // Handle data or error
}