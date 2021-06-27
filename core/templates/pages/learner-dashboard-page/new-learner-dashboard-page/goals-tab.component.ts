// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for goals tab in the Learner Dashboard page.
 */

import constants from 'assets/constants';
import { Component, Input } from '@angular/core';
import { LearnerTopicSummary } from 'domain/topic/learner-topic-summary.model';
import { LearnerDashboardActivityBackendApiService } from 'domain/learner_dashboard/learner-dashboard-activity-backend-api.service';
import { LearnerDashboardActivityIds } from 'domain/learner_dashboard/learner-dashboard-activity-ids.model';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { ClassroomDomainConstants } from 'domain/classroom/classroom-domain.constants';
import { LearnerDashboardIdsBackendApiService } from 'domain/learner_dashboard/learner-dashboard-ids-backend-api.service';
import { LearnerDashboardPageConstants } from '../learner-dashboard-page.constants';

 @Component({
   selector: 'oppia-goals-tab',
   templateUrl: './goals-tab.component.html'
 })
export class GoalsTabComponent {
  constructor(
    private urlInterpolationService: UrlInterpolationService,
    private learnerDashboardActivityBackendApiService: (
      LearnerDashboardActivityBackendApiService),
    private learnerDashboardIdsBackendApiService:
      LearnerDashboardIdsBackendApiService) {
  }
  @Input() currentGoals: LearnerTopicSummary[];
  @Input() editGoals: LearnerTopicSummary[];
  @Input() completedGoals: LearnerTopicSummary[];
  @Input() learntToPartiallyLearntTopics: string[];
  learnerDashboardActivityIds: LearnerDashboardActivityIds;
  MAX_CURRENT_GOALS_LENGTH: number;
  currentGoalsStoryIsShown: boolean[];
  topicBelongToCurrentGoals: boolean[] = [];
  topicIdsInCompletedGoals: string[] = [];
  topicIdsInCurrentGoals: string[] = [];
  topicToIndexMapping = {
    CURRENT: 0,
    COMPLETED: 1,
    NEITHER: 2
  };
  activityType: string = constants.ACTIVITY_TYPE_LEARN_TOPIC;

  ngOnInit(): void {
    this.learnerDashboardIdsBackendApiService.
      fetchLearnerDashboardIdsAsync().then(
        (learnerDashboardActivityIds) => {
          this.topicIdsInCompletedGoals = (
            learnerDashboardActivityIds.learntTopicIds);
          this.topicIdsInCurrentGoals = (
            learnerDashboardActivityIds.topicIdsToLearn);
        }
      );
    this.MAX_CURRENT_GOALS_LENGTH = constants.MAX_CURRENT_GOALS_COUNT;
    this.currentGoalsStoryIsShown = [];
  }

  getTopicPageUrl(
      topicUrlFragment: string, classroomUrlFragment: string): string {
    return this.urlInterpolationService.interpolateUrl(
      ClassroomDomainConstants.TOPIC_VIEWER_URL_TEMPLATE, {
        topic_url_fragment: topicUrlFragment,
        classroom_url_fragment: classroomUrlFragment
      });
  }

  getTopicClassification(topicId: string): number {
    if (this.topicIdsInCurrentGoals.includes(topicId)) {
      return this.topicToIndexMapping.CURRENT;
    } else if (this.topicIdsInCompletedGoals.includes(topicId)) {
      return this.topicToIndexMapping.COMPLETED;
    } else {
      return this.topicToIndexMapping.NEITHER;
    }
  }

  getStaticImageUrl(imagePath: string): string {
    return this.urlInterpolationService.getStaticImageUrl(imagePath);
  }

  topicBelongToLearntToPartiallyLearntTopics(topicName: string): boolean {
    if (this.learntToPartiallyLearntTopics.includes(topicName)) {
      return true;
    }
    return false;
  }

  toggleStory(index: string): void {
    this.currentGoalsStoryIsShown[index] = !(
      this.currentGoalsStoryIsShown[index]);
  }

  async addToLearnerGoals(
      topic: LearnerTopicSummary, topicId: string,
      index: number): Promise<void> {
    var activityId = topicId;
    var activityType = constants.ACTIVITY_TYPE_LEARN_TOPIC;
    if (!this.topicIdsInCurrentGoals.includes(activityId)) {
      var isSuccessfullyAdded = (
        await this.learnerDashboardActivityBackendApiService.addToLearnerGoals(
          activityId, activityType));
      if (isSuccessfullyAdded &&
        this.topicIdsInCurrentGoals.length < this.MAX_CURRENT_GOALS_LENGTH &&
        !this.topicIdsInCompletedGoals.includes(activityId)) {
        this.currentGoalsStoryIsShown.push(false);
        this.currentGoals.push(topic);
        this.topicIdsInCurrentGoals.push(activityId);
      }
    }
  }

  removeFromLearnerGoals(
      topicId: string, topicName: string, index: number): void {
    var activityId = topicId;
    var activityTitle = topicName;
    this.learnerDashboardActivityBackendApiService
      .removeActivityModalAsync(
        LearnerDashboardPageConstants
          .LEARNER_DASHBOARD_SECTION_I18N_IDS.CURRENT_GOALS
        , LearnerDashboardPageConstants
          .LEARNER_DASHBOARD_SUBSECTION_I18N_IDS.LEARN_TOPIC,
        activityId, activityTitle)
      .then(() => {
        this.currentGoalsStoryIsShown.splice(index, 1);
        this.currentGoals.splice(index, 1);
        this.topicIdsInCurrentGoals.splice(index, 1);
      });
  }
}
