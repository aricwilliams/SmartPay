import { useEffect } from 'react';
import { useAtom } from 'jotai';
import { jobsAtom } from '../atoms/jobsAtom';
import { fetchJobs } from '../services/api';

export const useJobs = () => {
    const [jobs, setJobs] = useAtom(jobsAtom);

    useEffect(() => {
        if (jobs.length === 0) {
            fetchJobs().then(setJobs).catch(console.error);
        }
    }, []);

    return jobs;
};
