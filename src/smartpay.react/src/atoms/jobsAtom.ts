import { atom } from 'jotai';
import { Job } from '../types';

export const jobsAtom = atom<Job[]>([]);
