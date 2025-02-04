// Copyright 2021 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Component for the navbar breadcrumb of the blog dashboard.
 */

import { Component, OnDestroy, OnInit} from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { AppConstants } from 'app.constants';
import { AlertsService } from 'services/alerts.service';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { BlogDashboardData, BlogDashboardBackendApiService } from 'domain/blog/blog-dashboard-backend-api.service';
import { LoaderService } from 'services/loader.service';
import { Subscription } from 'rxjs';
import { BlogDashboardPageService } from 'pages/blog-dashboard-page/services/blog-dashboard-page.service';
import { BlogPostSummary } from 'domain/blog/blog-post-summary.model';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';

@Component({
  selector: 'oppia-blog-dashboard-page',
  templateUrl: './blog-dashboard-page.component.html'
})
export class BlogDashboardPageComponent implements OnInit, OnDestroy {
  activeTab: string;
  activeView: string = 'gridView';
  authorProfilePictureUrl: string;
  blogDashboardData: BlogDashboardData;
  directiveSubscriptions = new Subscription();
  windowIsNarrow: boolean;
  DEFAULT_PROFILE_PICTURE_URL: string = '';
  constructor(
    private alertsService: AlertsService,
    private blogDashboardBackendService: BlogDashboardBackendApiService,
    private blogDashboardPageService: BlogDashboardPageService,
    private loaderService: LoaderService,
    private urlInterpolationService: UrlInterpolationService,
    private windowDimensionService: WindowDimensionsService,
  ) {}

  ngOnInit(): void {
    this.activeTab = this.blogDashboardPageService.activeTab;
    if (this.activeTab === 'main') {
      this.initMainTab();
    }

    this.windowIsNarrow = this.windowDimensionService.isWindowNarrow();
    this.windowDimensionService.getResizeEvent().subscribe(() => {
      this.windowIsNarrow = this.windowDimensionService.isWindowNarrow();
    });

    this.directiveSubscriptions.add(
      this.blogDashboardPageService.updateViewEventEmitter.subscribe(
        () => {
          this.activeTab = this.blogDashboardPageService.activeTab;
          if (this.activeTab === 'main') {
            this.initMainTab();
          }
        }
      )
    );
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }

  initMainTab(): void {
    this.loaderService.showLoadingScreen('Loading');
    this.DEFAULT_PROFILE_PICTURE_URL = this.urlInterpolationService
      .getStaticImageUrl('/general/no_profile_picture.png');
    this.blogDashboardBackendService.fetchBlogDashboardDataAsync().then(
      (dashboardData) => {
        this.blogDashboardData = dashboardData;
        this.authorProfilePictureUrl = decodeURIComponent((
          // eslint-disable-next-line max-len
          dashboardData.profilePictureDataUrl || this.DEFAULT_PROFILE_PICTURE_URL));
        this.loaderService.hideLoadingScreen();
      }, (errorResponse) => {
        if (
          AppConstants.FATAL_ERROR_CODES.indexOf(
            errorResponse) !== -1) {
          this.alertsService.addWarning('Failed to get blog dashboard data');
        }
      });
  }

  createNewBlogPost(): void {
    this.blogDashboardBackendService.createBlogPostAsync().then(
      (blogPostId) => {
        this.blogDashboardPageService.navigateToEditorTabWithId(blogPostId);
      }, (error) => {
        this.alertsService.addWarning(
          `Unable to create new blog post.Error: ${error}`);
      }
    );
  }

  unpublishedBlogPost(blogPostSummary: BlogPostSummary): void {
    let summaryDicts = this.blogDashboardData.publishedBlogPostSummaryDicts;
    let index = summaryDicts.indexOf(
      blogPostSummary);
    if (index > -1) {
      summaryDicts.splice(index, 1);
    }
    this.blogDashboardData.draftBlogPostSummaryDicts.unshift(
      blogPostSummary);
    this.blogDashboardData.numOfDraftBlogPosts += 1;
    this.blogDashboardData.numOfPublishedBlogPosts -= 1;
  }

  removeBlogPost(
      blogPostSummary: BlogPostSummary, blogPostWasPublished: boolean): void {
    let summaryDicts: BlogPostSummary[];
    if (blogPostWasPublished) {
      summaryDicts = this.blogDashboardData.publishedBlogPostSummaryDicts;
      this.blogDashboardData.numOfPublishedBlogPosts -= 1;
    } else {
      summaryDicts = this.blogDashboardData.draftBlogPostSummaryDicts;
      this.blogDashboardData.numOfDraftBlogPosts -= 1;
    }
    let index = summaryDicts.indexOf(
      blogPostSummary);
    if (index > -1) {
      summaryDicts.splice(index, 1);
    }
  }
}

angular.module('oppia').directive('oppiaBlogDashboardPage',
  downgradeComponent({
    component: BlogDashboardPageComponent
  }) as angular.IDirectiveFactory);
