import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree} from '@angular/router';
import {Observable} from 'rxjs';
import {DataForwardService} from "../service/data-forward.service";

@Injectable({
  providedIn: 'root'
})
export class MainViewGuard implements CanActivate {

  constructor(private dataForwardService: DataForwardService, private router: Router) {
  }
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    if(this.dataForwardService.dataset.length > 0) {
      return true;
    } else {
      return this.router.createUrlTree(['/upload']);
    }
  }

  // canDeactivate(component: TrainTestComponent, currentRoute: ActivatedRouteSnapshot, currentState: RouterStateSnapshot, nextState?: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
  //   return window.confirm("All progress will be lost")
  // }

}
