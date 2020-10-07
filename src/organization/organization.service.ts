import { Injectable } from '@nestjs/common';
import { DgraphService } from '../dgraph/dgraph.service';
import { OrgDefinition, RoleDefinition, roleDefinitionFullQuery } from '../Interfaces/Types';

@Injectable()
export class OrganizationService {
  constructor(private readonly dgraph: DgraphService) {}

  public async getAll() {
    const res = await this.dgraph.query(`
    query all($i: string){
      Data(func: eq(type, "org")) {
        uid
        name
        namespace
        definition ${roleDefinitionFullQuery}
      }
    }`);
    return res.getJson();
  }

  public async getApps(namespace: string) {
    const res = await this.dgraph.query(
      `
    query all($i: string){
      Data(func: eq(namespace, $i)) {
        namespace
        apps {
          name
          namespace
          definition ${roleDefinitionFullQuery}
        }
      }
    }`,
      { $i: namespace },
    );
    return res.getJson();
  }

  public async getByNamespace(namespace: string) {
    const res = await this.dgraph.query(
      `
    query all($i: string){
      Data(func: eq(namespace, $i)) {
        uid
        name
        namespace
        definition ${roleDefinitionFullQuery}
      }
    }`,
      { $i: namespace },
    );
    return res.getJson();
  }

  public async exists(namespace: string) {
    return (await this.getByNamespace(namespace)).Data.length > 0;
  }

  public async create(
    name: string,
    definition: OrgDefinition,
    namespace: string,
    owner: string,
  ) {
    const data = {
      uid: '_:new',
      type: 'org',
      name: name,
      definition,
      namespace,
      owner,
      apps: [],
    };

    const res = await this.dgraph.mutate(data);

    return res.getUidsMap().get('new');
  }

  public async addApp(id: string, appDefinitionId: string) {
    const data = {
      uid: id,
      apps: [
        {
          uid: appDefinitionId,
        },
      ],
    };

    await this.dgraph.mutate(data);

    return id;
  }
}
