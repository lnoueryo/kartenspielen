import { db } from '$lib/database';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

/** @type {import('@sveltekit/types').Load} */
export const load: PageServerLoad = async({params, url, locals}) => {
  //     console.log(url.searchParams.get('a'))
  if (!locals.user) {
    throw redirect(302, '/login')
  }

  locals.games = await db.games.findMany()
  return locals
};