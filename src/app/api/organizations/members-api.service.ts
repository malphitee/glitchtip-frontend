import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { baseUrl } from "../../constants";
import {
  Member,
  MemberDetail,
  OrgMemberUpdate,
} from "./organizations.interface";

@Injectable({
  providedIn: "root",
})
export class MembersAPIService {
  protected http = inject(HttpClient);

  readonly url = `/members/`;

  list(orgSlug: string) {
    return this.http.get<Member[]>(this.listURL(orgSlug));
  }

  retrieve(orgSlug: string, memberId: number) {
    return this.http.get<MemberDetail>(this.detailURL(orgSlug, memberId));
  }

  update(orgSlug: string, memberId: number, memberUpdateData: OrgMemberUpdate) {
    return this.http.put<Member>(
      this.detailURL(orgSlug, memberId),
      memberUpdateData,
    );
  }

  makeOrgOwner(orgSlug: string, memberId: number) {
    return this.http.post<Member>(
      this.detailURL(orgSlug, memberId) + "set_owner/",
      null,
    );
  }

  private listURL(organizationSlug: string) {
    return `${baseUrl}/organizations/${organizationSlug}${this.url}`;
  }

  private detailURL(orgSlug: string, memberId: number) {
    return `${this.listURL(orgSlug)}${memberId}/`;
  }
}
