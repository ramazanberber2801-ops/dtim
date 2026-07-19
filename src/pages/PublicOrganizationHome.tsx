import { PublicMembershipRequest } from '../components/PublicMembershipRequest';
import { DEFAULT_ORGANIZATION_ID } from '../lib/organization';
import { PublicMemberCardPage } from './PublicMemberCardPage';
import { PublicOrganizationPage } from './PublicOrganizationPage';

export function PublicOrganizationHome(){
 const path=window.location.pathname.replace(/\/+$/,'')||'/';
 if(path==='/member-card')return <PublicMemberCardPage/>;
 return <div><PublicOrganizationPage/><div className="mx-auto -mt-24 max-w-4xl px-4 pb-28"><PublicMembershipRequest organizationId={DEFAULT_ORGANIZATION_ID}/></div></div>;
}