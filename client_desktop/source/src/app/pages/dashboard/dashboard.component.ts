
import { Component, OnInit }    from '@angular/core';
import { Subscription }         from 'rxjs/Subscription';
import { LayoutService  }       from '../../services/layout.service';

@Component (
{
    selector    : 'dashboard'
,   templateUrl : './dashboard.component.html'
,   styleUrls   : ['./dashboard.component.css']
} )
export class DashboardComponent implements OnInit
{
    current_height:         string;
    subscription:           Subscription;

    constructor ( private layoutService  : LayoutService )
    {
    }

    ngOnInit ( ) : void
    {
        this.subscription = this.layoutService.observe_content_height ( ).subscribe (

            value => { this.resizeFn ( ); }

        );
    }

    private resizeFn ( )
    {
        this.current_height = this.layoutService.get_content_height ( );
    }

}
