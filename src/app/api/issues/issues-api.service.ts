import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { EMPTY } from "rxjs";
import { baseUrl } from "../../constants";
import { APIBaseService } from "../api-base.service";
import { IssueStatus, UpdateStatusResponse } from "src/app/issues/interfaces";

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
    return EMPTY;
  }

  orgIssuesUrl(orgSlug: string, issueId?: number) {
    let url = `${baseUrl}/organizations/${orgSlug}/issues/`;
    return issueId ? url + issueId + "/" : url;
  }
}
