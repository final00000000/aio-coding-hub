import { keepPreviousData, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  cliSessionsMessagesGet,
  cliSessionsProjectsList,
  cliSessionsSessionsList,
  type CliSessionsSource,
} from "../services/cliSessions";
import { cliSessionsKeys } from "./keys";

export function useCliSessionsProjectsListQuery(source: CliSessionsSource) {
  return useQuery({
    queryKey: cliSessionsKeys.projectsList(source),
    queryFn: () => cliSessionsProjectsList(source),
    enabled: true,
    placeholderData: keepPreviousData,
  });
}

export function useCliSessionsSessionsListQuery(
  source: CliSessionsSource,
  projectId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: cliSessionsKeys.sessionsList(source, projectId),
    queryFn: () => cliSessionsSessionsList(source, projectId),
    enabled: Boolean(projectId.trim()) && (options?.enabled ?? true),
    placeholderData: keepPreviousData,
  });
}

export function useCliSessionsMessagesInfiniteQuery(
  source: CliSessionsSource,
  filePath: string,
  options?: { enabled?: boolean; fromEnd?: boolean }
) {
  const fromEnd = options?.fromEnd ?? true;
  return useInfiniteQuery({
    queryKey: cliSessionsKeys.messages(source, filePath, fromEnd),
    queryFn: ({ pageParam = 0 }) =>
      cliSessionsMessagesGet({
        source,
        file_path: filePath,
        page: pageParam,
        page_size: 50,
        from_end: fromEnd,
      }),
    enabled: Boolean(filePath.trim()) && (options?.enabled ?? true),
    getNextPageParam: (lastPage) => (lastPage?.has_more ? lastPage.page + 1 : undefined),
    initialPageParam: 0,
  });
}
