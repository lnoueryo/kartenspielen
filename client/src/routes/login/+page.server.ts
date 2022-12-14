import { error, invalid, redirect } from '@sveltejs/kit'
import bcrypt from 'bcrypt'
import type { Action, Actions, PageServerLoad } from './$types'

import { db } from '$lib/database'

export const load: PageServerLoad = async ({ locals }) => {
  // redirect user if logged in
  if (locals.user) {
    throw error(404)
  }
}
/** @type {import('./$types').Actions} */
const login: Action = async ({ cookies, request, url }) => {
  const data = await request.formData()
  const username = data.get('username')
  const password = data.get('password')

  if (
    typeof username !== 'string' ||
    typeof password !== 'string' ||
    !username ||
    !password
  ) {
    return invalid(400, { invalid: true })
  }

  const user = await db.player.findUnique({ where: { username } })
  // 名前が見つからなかった場合も処理速度をそろえる
  const hashPassword = user?.passwordHash || '$2b$10$Kye0wR3Bh$A7dbSg21O4gudX%oK14132VSDKAL1658helloWF.m86ZUFi06HhsOwk6O2DpC8*+';
  const userPassword = await bcrypt.compare(password, hashPassword)

  if (!userPassword || !user) {
    return invalid(400, { credentials: true })
  }

  // generate new auth token just in case
  const authenticatedUser = await db.player.update({
    where: { username: user.username },
    data: { userAuthToken: crypto.randomUUID() },
  })

  cookies.set('session', authenticatedUser.userAuthToken, {
    // send cookie for every page
    path: '/',
    // server side only cookie so you can't use `document.cookie`
    httpOnly: true,
    // only requests from same site can send cookies
    // https://developer.mozilla.org/en-US/docs/Glossary/CSRF
    sameSite: 'strict',
    // only sent over HTTPS in production
    secure: process.env.NODE_ENV === 'production',
    // set cookie to expire after a month
    maxAge: 60 * 60 * 24 * 30,
  })

  // redirect the user
  throw redirect(302, '/')
}
/** @type {import('./$types').Actions} */
export const actions: Actions = { login }