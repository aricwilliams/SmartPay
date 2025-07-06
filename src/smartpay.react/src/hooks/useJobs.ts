// hooks/useJobs.ts
import { useEffect } from "react";
import { useAtom } from "jotai";
import { jobsAtom } from "../atoms/jobsAtom";
import { fetchJobs } from "../services/api";
import { Job } from "@/types";

export const useJobs = () => {
  const [jobs, setJobs] = useAtom<Job[]>(jobsAtom);

  // initial fetch
  useEffect(() => {
    if (jobs.length === 0) {
      fetchJobs().then(setJobs).catch(console.error);
    }
  }, []);

  /** call this after POST /api/jobs to pull fresh data */
  const mutate = async () => {
    const data = await fetchJobs();
    setJobs(data);
  };

  return { jobs, mutate };
};
