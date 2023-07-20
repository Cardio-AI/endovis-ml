import {Component} from '@angular/core';
import {DataService} from "./service/data.service";
import {DataParserService} from "./service/data-parser.service";
import {DataForwardService} from "./service/data-forward.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'endovis-ml';

  menuToggled = false;

  constructor(private dataService: DataService, private dataParserService: DataParserService, private dataForwardService: DataForwardService) {
  }

  ngOnInit(): void {

  }

  toggleMenu() {
    this.menuToggled = !this.menuToggled;
  }

}
