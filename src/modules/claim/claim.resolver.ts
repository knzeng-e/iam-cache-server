import { Args, Resolver, Query, Mutation } from '@nestjs/graphql';
import { UserGQL } from '../../common/user.decorator';
import { AuthGQL } from '../auth/auth.decorator';
import { Claim } from './claim.entity';
import { ClaimService } from './claim.service';

@AuthGQL()
@Resolver(() => Claim)
export class ClaimResolver {
  constructor(private readonly claimService: ClaimService) {}

  @Query(() => Claim)
  async claim(@Args('id', { type: () => String }) id: string) {
    return this.claimService.getById(id);
  }

  @Query(() => [Claim])
  async claimsByParentNamespace(
    @Args('namespace', { type: () => String }) namespace: string,
  ) {
    return this.claimService.getByParentNamespace(namespace);
  }

  @Query(() => [Claim])
  async claimsByUser(
    @Args('user', { type: () => String }) did?: string,
    @Args('accepted', { type: () => Boolean, nullable: true })
    accepted?: boolean,
    @Args('parentNamespace', { type: () => String, nullable: true })
    parentNamespace?: string,
    @UserGQL()
    user?: string,
  ) {
    return this.claimService.getByUserDid({
      did,
      currentUser: user,
      filters: { accepted, parentNamespace },
    });
  }

  @Query(() => [Claim])
  async claimsByIssuer(
    @Args('issuer', { type: () => String }) issuer?: string,
    @Args('accepted', { type: () => Boolean, nullable: true })
    accepted?: boolean,
    @Args('parentNamespace', { type: () => String, nullable: true })
    parentNamespace?: string,
    @UserGQL()
    user?: string,
  ) {
    return this.claimService.getByIssuer({
      issuer,
      currentUser: user,
      filters: { accepted, parentNamespace },
    });
  }

  @Query(() => [Claim])
  async claimsByRequester(
    @Args('requester', { type: () => String })
    requester?: string,
    @Args('accepted', { type: () => Boolean, nullable: true })
    accepted?: boolean,
    @Args('parentNamespace', { type: () => String, nullable: true })
    parentNamespace?: string,
    @UserGQL()
    user?: string,
  ) {
    return this.claimService.getByRequester({
      requester,
      currentUser: user,
      filters: { accepted, parentNamespace },
    });
  }

  @Mutation(() => Boolean)
  async deleteClaim(
    @Args('id', { type: () => String }) id: string,
    @UserGQL() user?: string,
  ) {
    await this.claimService.removeById(id, user);
    return true;
  }
}
