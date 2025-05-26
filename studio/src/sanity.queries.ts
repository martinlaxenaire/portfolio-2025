import {groq} from 'groq'
import {homeQueryString, gameQueryString} from './queries-strings'

const homeQuery = groq`${homeQueryString}`
const gameQuery = groq`${gameQueryString}`
