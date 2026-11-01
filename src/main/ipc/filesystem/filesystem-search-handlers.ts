import { ipcMain } from 'electron'
import { listQuickOpenFiles } from '../filesystem-list-files'
import {
  isFileNameFilterQueryTooLarge,
  createFileNameFilterMatcher
} from '../../../shared/file-name-filter-tokens'
import type { FilesystemHandlerContext } from './filesystem-handler-context'
import { registerFilesystemContentSearchHandler } from './filesystem-content-search-handler'

export function registerFilesystemSearchHandlers(context: FilesystemHandlerContext): void {
  registerFilesystemContentSearchHandler(context)
  const { store } = context
  const { listFilesCancellations } = context
  ipcMain.handle(
    'fs:listFiles',
    async (
      event,
      args: {
        rootPath: string
        connectionId?: string
        excludePaths?: string[]
        requestToken?: string
        maxResults?: number
        candidatePaths?: string[]
        searchQuery?: string
        includeIgnored?: boolean
        allowLegacyIncludeIgnored?: boolean
        followSymlinks?: boolean
        /** Local only: match Explorer phrases, exclusions, and path/name/ext qualifiers. */
        nameFilter?: string
      }
    ): Promise<string[]> => {
      const controller = listFilesCancellations.begin(event, args.requestToken)
      try {
        // Why: an SSH target is not served here; quick-open shows "No matching files", as it did when disconnected.
        if (args.connectionId) {
          return []
        }
        if (args.nameFilter !== undefined && isFileNameFilterQueryTooLarge(args.nameFilter)) {
          return []
        }
        const nameFilter = args.nameFilter
          ? createFileNameFilterMatcher(args.nameFilter)
          : undefined
        return await listQuickOpenFiles(
          args.rootPath,
          store,
          args.excludePaths,
          controller?.signal,
          args.maxResults,
          undefined,
          nameFilter,
          args
        )
      } finally {
        listFilesCancellations.finish(event, args.requestToken, controller)
      }
    }
  )

  ipcMain.handle('fs:cancelListFiles', (event, args: { requestToken: string }): void => {
    listFilesCancellations.cancel(event, args.requestToken)
  })
}
