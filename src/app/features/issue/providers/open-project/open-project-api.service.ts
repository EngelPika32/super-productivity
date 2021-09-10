import { Injectable } from '@angular/core';
import { OpenProjectCfg } from './open-project.model';
import { SnackService } from '../../../../core/snack/snack.service';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
  HttpParams,
  HttpRequest,
} from '@angular/common/http';
import { Observable, ObservableInput, throwError } from 'rxjs';
import {
  OpenProjectOriginalWorkPackage,
  OpenProjectWorkPackageSearchResult,
} from './open-project-api-responses';
import { catchError, filter, map, tap } from 'rxjs/operators';
import {
  mapOpenProjectIssue,
  mapOpenProjectIssueToSearchResult,
} from './open-project-issue/open-project-issue-map.util';
import {
  OpenProjectWorkPackage,
  OpenProjectWorkPackageReduced,
} from './open-project-issue/open-project-issue.model';
import { SearchResultItem } from '../../issue.model';
import { HANDLED_ERROR_PROP_STR } from '../../../../app.constants';
import { T } from '../../../../t.const';
import { throwHandledError } from '../../../../util/throw-handled-error';

@Injectable({
  providedIn: 'root',
})
export class OpenProjectApiService {
  constructor(private _snackService: SnackService, private _http: HttpClient) {}

  getById$(
    issueId: number,
    cfg: OpenProjectCfg,
    isGetComments: boolean = true,
  ): Observable<OpenProjectWorkPackage> {
    return this._sendRequest$(
      {
        // url: `${cfg.host}/api/v3/projects/${cfg.projectId}/${issueId}`,
        url: `${cfg.host}/api/v3/work_packages/${issueId}`,
      },
      cfg,
    );
  }

  searchIssueForRepo$(
    searchText: string,
    cfg: OpenProjectCfg,
    isSearchAllOpenProject: boolean = false,
  ): Observable<SearchResultItem[]> {
    return this._sendRequest$(
      {
        url: `${cfg.host}/api/v3/projects/${cfg.projectId}/work_packages`,
      },
      cfg,
    ).pipe(
      map((res: OpenProjectWorkPackageSearchResult) => {
        return res && res._embedded.elements
          ? res._embedded.elements
              .map(mapOpenProjectIssue)
              // TODO add better search and caching
              .filter((workPackage: OpenProjectWorkPackage) =>
                workPackage.subject.match(searchText),
              )
              .map(mapOpenProjectIssueToSearchResult)
          : [];
      }),
      // TODO remove
      tap(console.log),
    );
  }

  getLast100IssuesForRepo$(
    cfg: OpenProjectCfg,
  ): Observable<OpenProjectWorkPackageReduced[]> {
    const host = cfg.host;
    return this._sendRequest$(
      {
        url: `${host}/issues?per_page=100&sort=updated`,
      },
      cfg,
    ).pipe(
      map((issues: OpenProjectOriginalWorkPackage[]) =>
        issues ? issues.map(mapOpenProjectIssue) : [],
      ),
    );
  }

  private _checkSettings(cfg: OpenProjectCfg): void {
    if (!this._isValidSettings(cfg)) {
      this._snackService.open({
        type: 'ERROR',
        msg: T.F.OPEN_PROJECT.S.ERR_NOT_CONFIGURED,
      });
      throwHandledError('OpenProject: Not enough settings');
    }
  }

  private _isValidSettings(cfg: OpenProjectCfg): boolean {
    return (
      !!cfg &&
      !!cfg.host &&
      cfg.host.length > 0 &&
      !!cfg.projectId &&
      cfg.projectId.length > 0
    );
  }

  private _sendRequest$(
    params: HttpRequest<string> | any,
    cfg: OpenProjectCfg,
  ): Observable<any> {
    this._checkSettings(cfg);

    const p: HttpRequest<any> | any = {
      ...params,
      method: params.method || 'GET',
      headers: {
        ...(cfg.token ? { Authorization: 'token ' + cfg.token } : {}),
        ...(params.headers ? params.headers : {}),
      },
    };

    const bodyArg = params.data ? [params.data] : [];

    const allArgs = [
      ...bodyArg,
      {
        headers: new HttpHeaders(p.headers),
        params: new HttpParams({ fromObject: p.params }),
        reportProgress: false,
        observe: 'response',
        responseType: params.responseType,
      },
    ];
    const req = new HttpRequest(p.method, p.url, ...allArgs);
    return this._http.request(req).pipe(
      // TODO remove type: 0 @see https://brianflove.com/2018/09/03/angular-http-client-observe-response/
      filter((res) => !(res === Object(res) && res.type === 0)),
      map((res: any) => (res && res.body ? res.body : res)),
      catchError(this._handleRequestError$.bind(this)),
    );
  }

  private _handleRequestError$(
    error: HttpErrorResponse,
    caught: Observable<unknown>,
  ): ObservableInput<unknown> {
    if (error.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      this._snackService.open({
        type: 'ERROR',
        msg: T.F.OPEN_PROJECT.S.ERR_NETWORK,
      });
    } else if (error.error && error.error.message) {
      this._snackService.open({
        type: 'ERROR',
        msg: 'OpenProject: ' + error.error.message,
      });
    } else {
      // The backend returned an unsuccessful response code.
      this._snackService.open({
        type: 'ERROR',
        translateParams: {
          errorMsg:
            (error.error && (error.error.name || error.error.statusText)) ||
            error.toString(),
          statusCode: error.status,
        },
        msg: T.F.OPEN_PROJECT.S.ERR_UNKNOWN,
      });
    }
    if (error && error.message) {
      return throwError({ [HANDLED_ERROR_PROP_STR]: 'OpenProject: ' + error.message });
    }

    return throwError({ [HANDLED_ERROR_PROP_STR]: 'OpenProject: Api request failed.' });
  }
}