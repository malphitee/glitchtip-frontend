import { Injectable, inject } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { EMPTY } from "rxjs";
import { baseUrl } from "../../constants";
import { APIBaseService } from "../api-base.service";
import {
  IssueStatus,
  IssueTags,
  UpdateStatusResponse,
} from "src/app/issues/interfaces";

@Injectable({
  providedIn: "root",
})
export class IssuesAPIService extends APIBaseService {
  protected http: HttpClient;

  readonly url = baseUrl + "/issues/";
  constructor() {
    const http = inject(HttpClient);

    super(http);

    this.http = http;
  }

  list(slug1?: string, slug2?: string) {
    return EMPTY;
  }

  retrieve(id: string) {
    return EMPTY;
  }

  update(status: IssueStatus, orgSlug: string, id: number) {
    return this.http.put<UpdateStatusResponse>(this.orgIssuesUrl(orgSlug, id), {
      status,
    });
  }

  destroy(id: string) {
    return this.http.delete(this.detailURL(id));
  }

  retrieveTags(issueId: string, query?: string) {
    const url = `${this.url}${issueId}/tags/`;
    let params = new HttpParams();
    if (query) {
      params = params.append("query", query);
    }
    return this.http.get<IssueTags[]>(url, { params });
  }

  orgIssuesUrl(orgSlug: string, issueId?: number) {
    let url = `${baseUrl}/organizations/${orgSlug}/issues/`;
    return issueId ? url + issueId + "/" : url;
  }
}
