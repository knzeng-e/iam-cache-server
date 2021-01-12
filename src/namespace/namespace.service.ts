import { Injectable } from '@nestjs/common';
import { DgraphService } from '../dgraph/dgraph.service';
import { Organization } from '../organization/OrganizationTypes';
import { Application } from '../application/ApplicationTypes';
import { Role } from '../role/RoleTypes';
import { NamespaceEntities } from './namespace.types';

const expand = `
      expand(_all_) {
       expand(_all_) {
        expand(_all_)
       }
      }
    `;

@Injectable()
export class NamespaceService {
  constructor(private readonly dgraph: DgraphService) {}

  public async getByNamespace(
    namespace: string,
    full = false,
    types?: string[],
  ): Promise<Organization | Application | Role> {
    let filters = '';
    if (types) {
      if (!Array.isArray(types)) {
        types = [types];
      }
      types = types.filter(t => ['App', 'Org', 'Role'].includes(t));
      filters = `@filter(eq(dgraph.type, [${types
        .map(a => `"${a}"`)
        .join(',')}]))`;
    }

    const res = await this.dgraph.query(`
    {data(func: eq(namespace, "${namespace}")) ${filters} {
      uid
      ${full ? expand : ''}
    }}`);
    const json = res.getJson();

    return json.data[0];
  }
  public async namespaceExists(namespace: string): Promise<boolean> {
    const res = await this.getByNamespace(namespace);
    return Boolean(res?.uid);
  }

  /**
   * returns App/Org with namespace matching or similar to provided text
   * @param text fragment of namespace string
   * @return Array of Apps and Orgs
   */
  public async searchByText(
    text: string,
    type?: NamespaceEntities,
  ): Promise<(Application | Organization | Role)[]> {
    const directNamespacesPromise = this.dgraph.query(
      `{
        data(
          func: ${type ? `type(${type})` : 'has(namespace)'})
          @filter(
            regexp(namespace, /${text}/i) OR
            regexp(name, /${text}/i)
          ) {
            uid
            name
            definition {
              expand(_all_)
            }
            owner
            namespace
        }
      }`,
      { $type: type },
    );
    const reverseNamespacesPromise = await this.dgraph.query(
      `{
      data(func: ${
        type ? `type(${type}Definition)` : 'has(description)'
      }) @filter(regexp(websiteUrl, /${text}/) OR regexp(description, /${text}/) AND has(~definition)) {
        ~definition {
          uid
          name
          definition {
            expand(_all_)
          }
          owner
          namespace
        }
      }
      }`,
    );
    const [
      directNamespacesResponse,
      reverseNamespacesResponse,
    ] = await Promise.all([directNamespacesPromise, reverseNamespacesPromise]);
    const reverseNamespaces = reverseNamespacesResponse.getJson() as {
      data: {
        '~definition': (Application | Organization | Role)[];
      }[];
    };
    const namespaces = reverseNamespaces.data.reduce(
      (acc, { '~definition': def }) => {
        acc.push(...def);
        return acc;
      },
      [] as (Application | Organization | Role)[],
    );
    const { data: directNamespaces } = directNamespacesResponse.getJson() as {
      data: (Application | Organization | Role)[];
    };
    const unique: Record<string, Application | Organization | Role> = {};
    for (const { uid, ...rest } of [...directNamespaces, ...namespaces]) {
      if (unique[uid]) continue;
      unique[uid] = { uid, ...rest };
    }
    return Object.values(unique);
  }
}
